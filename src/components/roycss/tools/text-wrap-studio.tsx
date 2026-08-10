"use client";

/**
 * TextWrapStudio — a self-contained CSS text-wrapping playground.
 *
 * Modern CSS gives developers fine-grained control over how text wraps inside
 * a block container. This tool exposes every relevant property:
 *
 *   • `text-wrap` (wrap | nowrap | balance | pretty | stable) — Baseline 2024
 *   • `text-wrap-mode` (wrap | nowrap) — longhand of `text-wrap`
 *   • `line-break` (auto | loose | normal | strict | anywhere)
 *   • `word-break` (normal | break-all | keep-all)
 *   • `overflow-wrap` (normal | break-word | anywhere)
 *   • `hyphens` (none | manual | auto) — requires a `lang` attribute
 *   • `hanging-punctuation` (none | first | last | force-end | allow-end) —
 *     Safari-only as of late 2024
 *   • `text-align` (start | end | justify | justify-all)
 *
 * Developers can:
 *   1. Edit the sample text (defaults to a paragraph with long words, short
 *      words, and tricky punctuation).
 *   2. Drag a container-width slider (200–800px) to trigger re-wrapping at
 *      different widths.
 *   3. Toggle each property via radio groups / selects.
 *   4. See a before/after side-by-side comparison: the left paragraph uses
 *      default wrapping, the right applies the selected properties.
 *   5. Read a live line-count + balance score (computed from the rendered
 *      line rects via the Range API).
 *   6. Copy the generated CSS rule.
 *   7. Load one of six presets (headline-balance, body-pretty,
 *      justified-book, cjk-keep-all, code-break-all, poetry-hanging).
 *   8. See per-property Baseline badges (balance = Chrome 114+ Baseline 2024;
 *      pretty = Chrome 117+; hanging-punctuation = Safari-only).
 *
 * Implementation notes:
 *   - The "after" paragraph's style is applied via inline `style`. Inline
 *     styles can't set `::first-letter`, but every property here is a plain
 *     inherited property that works on the `<p>` itself.
 *   - Line count + balance score are measured with `Range.getClientRects()`
 *     to count distinct line tops and the min/max line widths. Lower variance
 *     ⇒ higher balance score.
 *   - `hyphens: auto` requires a `lang` attribute; we set `lang="en"` on the
 *     paragraph when that mode is active.
 *   - All cleanup-safe: a single copy timeout is cleared on unmount.
 *   - TS strict, no `any`, no `console.log`. Self-contained (no props, no
 *     external state, no network). Responsive within `max-w-2xl`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  AlignLeft,
  Check,
  Copy,
  Globe,
  RotateCcw,
  Ruler,
  Sparkles,
  WrapText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type TextWrap = "wrap" | "nowrap" | "balance" | "pretty" | "stable";
type TextWrapMode = "wrap" | "nowrap";
type LineBreak = "auto" | "loose" | "normal" | "strict" | "anywhere";
type WordBreak = "normal" | "break-all" | "keep-all";
type OverflowWrap = "normal" | "break-word" | "anywhere";
type Hyphens = "none" | "manual" | "auto";
type HangingPunctuation =
  | "none"
  | "first"
  | "last"
  | "force-end"
  | "allow-end";
// Named `TextAlignValue` (not `TextAlign`) to avoid clashing with the
// DOM's global `TextAlign` type from lib.dom.d.ts.
type TextAlignValue = "start" | "end" | "justify" | "justify-all";

interface StudioState {
  textWrap: TextWrap;
  textWrapMode: TextWrapMode;
  lineBreak: LineBreak;
  wordBreak: WordBreak;
  overflowWrap: OverflowWrap;
  hyphens: Hyphens;
  hangingPunctuation: HangingPunctuation;
  textAlign: TextAlignValue;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  state: StudioState;
}

interface LineInfo {
  count: number;
  /** 0–100; higher = more evenly balanced line widths. */
  balance: number;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_TEXT =
  "Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed. Superlongwordlike antidisestablishmentarianism can break layouts; short words like a, an, the balance it out. \"Punctuation,\" she said — matters more than you think!";

const DEFAULT_STATE: StudioState = {
  textWrap: "balance",
  textWrapMode: "wrap",
  lineBreak: "auto",
  wordBreak: "normal",
  overflowWrap: "normal",
  hyphens: "none",
  hangingPunctuation: "none",
  textAlign: "start",
};

const COPY_CONFIRM_MS = 2000;

const TEXT_WRAP_OPTIONS: { value: TextWrap; label: string; baseline?: string }[] = [
  { value: "wrap", label: "wrap" },
  { value: "nowrap", label: "nowrap" },
  { value: "balance", label: "balance", baseline: "Chrome 114+ · Baseline 2024" },
  { value: "pretty", label: "pretty", baseline: "Chrome 117+" },
  { value: "stable", label: "stable", baseline: "Chrome 130+" },
];

const TEXT_WRAP_MODE_OPTIONS: TextWrapMode[] = ["wrap", "nowrap"];

const LINE_BREAK_OPTIONS: LineBreak[] = [
  "auto",
  "loose",
  "normal",
  "strict",
  "anywhere",
];

const WORD_BREAK_OPTIONS: WordBreak[] = ["normal", "break-all", "keep-all"];

const OVERFLOW_WRAP_OPTIONS: OverflowWrap[] = [
  "normal",
  "break-word",
  "anywhere",
];

const HYPHENS_OPTIONS: Hyphens[] = ["none", "manual", "auto"];

const HANGING_PUNCTUATION_OPTIONS: HangingPunctuation[] = [
  "none",
  "first",
  "last",
  "force-end",
  "allow-end",
];

const TEXT_ALIGN_OPTIONS: TextAlignValue[] = [
  "start",
  "end",
  "justify",
  "justify-all",
];

const PRESETS: Preset[] = [
  {
    id: "headline-balance",
    name: "Headline Balance",
    description: "text-wrap: balance for headlines",
    state: {
      textWrap: "balance",
      textWrapMode: "wrap",
      lineBreak: "auto",
      wordBreak: "normal",
      overflowWrap: "normal",
      hyphens: "none",
      hangingPunctuation: "none",
      textAlign: "start",
    },
  },
  {
    id: "body-pretty",
    name: "Body Pretty",
    description: "text-wrap: pretty — fewer orphan words",
    state: {
      textWrap: "pretty",
      textWrapMode: "wrap",
      lineBreak: "auto",
      wordBreak: "normal",
      overflowWrap: "normal",
      hyphens: "none",
      hangingPunctuation: "none",
      textAlign: "start",
    },
  },
  {
    id: "justified-book",
    name: "Justified Book",
    description: "justify + hyphens auto for book-like columns",
    state: {
      textWrap: "wrap",
      textWrapMode: "wrap",
      lineBreak: "auto",
      wordBreak: "normal",
      overflowWrap: "normal",
      hyphens: "auto",
      hangingPunctuation: "none",
      textAlign: "justify",
    },
  },
  {
    id: "cjk-keep-all",
    name: "CJK Keep-All",
    description: "word-break: keep-all for Chinese/Japanese/Korean",
    state: {
      textWrap: "wrap",
      textWrapMode: "wrap",
      lineBreak: "strict",
      wordBreak: "keep-all",
      overflowWrap: "normal",
      hyphens: "none",
      hangingPunctuation: "none",
      textAlign: "start",
    },
  },
  {
    id: "code-break-all",
    name: "Code Break-All",
    description: "word-break + overflow-wrap for long tokens / URLs",
    state: {
      textWrap: "wrap",
      textWrapMode: "wrap",
      lineBreak: "anywhere",
      wordBreak: "break-all",
      overflowWrap: "anywhere",
      hyphens: "none",
      hangingPunctuation: "none",
      textAlign: "start",
    },
  },
  {
    id: "poetry-hanging",
    name: "Poetry Hanging",
    description: "hanging-punctuation: first last (Safari-only)",
    state: {
      textWrap: "pretty",
      textWrapMode: "wrap",
      lineBreak: "auto",
      wordBreak: "normal",
      overflowWrap: "normal",
      hyphens: "none",
      hangingPunctuation: "first",
      textAlign: "start",
    },
  },
];

// ============================================================
// Line-measurement helper (Range API)
// ============================================================

/**
 * Measure the rendered lines of a paragraph element.
 *
 * Uses `Range.getClientRects()` to enumerate every line-box the browser laid
 * out, then collapses them by rounded `top` value (a single visual line may
 * be split across multiple client rects when there are inline children).
 *
 * Returns `{ count, balance }` where `balance` is a 0–100 score derived from
 * `min_line_width / max_line_width`. A single-line paragraph scores 100.
 */
function measureLines(el: HTMLElement | null): LineInfo {
  if (!el || typeof document === "undefined" || !el.textContent) {
    return { count: 0, balance: 0 };
  }
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = Array.from(range.getClientRects());
  if (rects.length === 0) return { count: 0, balance: 0 };

  // Collapse rects sharing a rounded top into a single line.
  const byTop = new Map<number, { left: number; right: number }>();
  for (const r of rects) {
    const top = Math.round(r.top);
    const existing = byTop.get(top);
    if (!existing) {
      byTop.set(top, { left: r.left, right: r.right });
    } else {
      existing.left = Math.min(existing.left, r.left);
      existing.right = Math.max(existing.right, r.right);
    }
  }

  const lines = Array.from(byTop.values()).sort((a, b) => a.left - b.left);
  if (lines.length <= 1) return { count: lines.length, balance: 100 };

  const widths = lines.map((l) => l.right - l.left);
  const maxWidth = Math.max(...widths);
  const minWidth = Math.min(...widths);
  if (maxWidth <= 0) return { count: lines.length, balance: 0 };

  // For the last line, partial fill is normal (paragraphs rarely end on a
  // full line). Score it more leniently: cap minimum at 30% so a normal
  // short last line doesn't tank the score.
  const fullLines = widths.slice(0, -1);
  const fullMax = fullLines.length > 0 ? Math.max(...fullLines) : maxWidth;
  const fullMin = fullLines.length > 0 ? Math.min(...fullLines) : minWidth;
  if (fullMax <= 0) return { count: lines.length, balance: 0 };
  const ratio = Math.max(fullMin / fullMax, 0.3);
  const balance = Math.round(ratio * 100);
  return { count: lines.length, balance };
}

// ============================================================
// CSS generation
// ============================================================

function buildGeneratedCss(state: StudioState): string {
  const lines: string[] = ["p {"];
  lines.push(`  text-wrap: ${state.textWrap};`);
  lines.push(`  text-wrap-mode: ${state.textWrapMode};`);
  lines.push(`  line-break: ${state.lineBreak};`);
  lines.push(`  word-break: ${state.wordBreak};`);
  lines.push(`  overflow-wrap: ${state.overflowWrap};`);
  lines.push(`  hyphens: ${state.hyphens};`);
  if (state.hyphens === "auto") lines.push(`  /* requires lang="en" */`);
  lines.push(`  hanging-punctuation: ${state.hangingPunctuation};`);
  lines.push(`  text-align: ${state.textAlign};`);
  lines.push("}");
  return lines.join("\n");
}

// ============================================================
// Sub-component: a labelled select row
// ============================================================

interface SelectRowProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  badge?: string;
}

function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
  badge,
}: SelectRowProps<T>) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        {badge ? (
          <Badge variant="outline" className="font-mono text-[9px] text-muted-foreground">
            {badge}
          </Badge>
        ) : null}
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt} className="text-xs">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function TextWrapStudio() {
  // ── State ────────────────────────────────────────────────────────
  const [text, setText] = useState(DEFAULT_TEXT);
  const [width, setWidth] = useState(420);
  const [state, setState] = useState<StudioState>(DEFAULT_STATE);
  const [copied, setCopied] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(
    "headline-balance",
  );
  const [beforeLines, setBeforeLines] = useState<LineInfo>({
    count: 0,
    balance: 0,
  });
  const [afterLines, setAfterLines] = useState<LineInfo>({
    count: 0,
    balance: 0,
  });

  // ── Refs ────────────────────────────────────────────────────────
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beforeRef = useRef<HTMLParagraphElement>(null);
  const afterRef = useRef<HTMLParagraphElement>(null);

  // ── Patch helper ─────────────────────────────────────────────────
  const patch = useCallback(<K extends keyof StudioState>(key: K, value: StudioState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setActivePresetId(null);
  }, []);

  // ── Derived: generated CSS ──────────────────────────────────────
  const generatedCss = useMemo(() => buildGeneratedCss(state), [state]);

  // ── Derived: after-paragraph style ──────────────────────────────
  // `textAlign: justify-all` is a valid CSS value that React's CSSProperties
  // typings don't include, so we widen via `as CSSProperties["textAlign"]`.
  const afterStyle = useMemo<CSSProperties>(
    () => ({
      textWrap: state.textWrap,
      textWrapMode: state.textWrapMode,
      lineBreak: state.lineBreak,
      wordBreak: state.wordBreak,
      overflowWrap: state.overflowWrap,
      hyphens: state.hyphens,
      hangingPunctuation: state.hangingPunctuation,
      textAlign: state.textAlign as CSSProperties["textAlign"],
    }),
    [state],
  );

  // ── Derived: lang attribute (for hyphens: auto) ─────────────────
  const afterLang = state.hyphens === "auto" ? "en" : undefined;

  // ── Derived: before-paragraph style (browser defaults) ──────────
  const beforeStyle = useMemo<CSSProperties>(
    () => ({
      textWrap: "wrap",
      textAlign: "start",
    }),
    [],
  );

  // ── Measure lines whenever text / width / state changes ─────────
  useEffect(() => {
    // Double-RAF so the browser finishes layout before we measure.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setBeforeLines(measureLines(beforeRef.current));
        setAfterLines(measureLines(afterRef.current));
      }),
    );
    return () => cancelAnimationFrame(raf);
  }, [text, width, state]);

  // ── Presets ─────────────────────────────────────────────────────
  const applyPreset = useCallback((preset: Preset) => {
    setState(preset.state);
    setActivePresetId(preset.id);
  }, []);

  const handleReset = useCallback(() => {
    setText(DEFAULT_TEXT);
    setWidth(420);
    setState(DEFAULT_STATE);
    setActivePresetId("headline-balance");
  }, []);

  // ── Copy ────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(
        () => setCopied(false),
        COPY_CONFIRM_MS,
      );
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [generatedCss]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // ── Balance-score colour ────────────────────────────────────────
  const balanceColor = useCallback((score: number) => {
    if (score >= 85) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  }, []);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <WrapText className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Text Wrap Studio</h3>
            <p className="text-xs text-muted-foreground">
              Modern CSS text-wrapping · balance · pretty · hanging-punctuation
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Reset to defaults"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {/* ── Sample text + width slider ──────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <Label
          htmlFor="tws-text"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          <AlignLeft className="size-3.5" />
          Sample text
        </Label>
        <Textarea
          id="tws-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="text-sm leading-relaxed"
          aria-label="Editable sample text for wrapping preview"
        />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Ruler className="size-3.5" />
              Container width
            </Label>
            <span className="font-mono text-[10px] text-muted-foreground">
              {width}px
            </span>
          </div>
          <Slider
            value={[width]}
            min={200}
            max={800}
            step={10}
            onValueChange={(v) => setWidth(v[0])}
            aria-label="Preview container width"
          />
        </div>
      </div>

      {/* ── Before / After comparison ───────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <AlignLeft className="size-3.5" />
            Before / After
          </span>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>
              Before:{" "}
              <span className="font-mono text-foreground">
                {beforeLines.count}
              </span>{" "}
              lines
            </span>
            <span>
              After:{" "}
              <span className="font-mono text-foreground">
                {afterLines.count}
              </span>{" "}
              lines
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Before */}
          <figure className="space-y-2 rounded-lg border border-border bg-background p-3">
            <figcaption className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                Before (default)
              </span>
              <Badge variant="outline" className="font-mono text-[9px]">
                balance:{" "}
                <span className={balanceColor(beforeLines.balance)}>
                  {beforeLines.balance}
                </span>
              </Badge>
            </figcaption>
            <div
              className="overflow-hidden rounded-md bg-white p-3"
              style={{ width: "100%" }}
            >
              <p
                ref={beforeRef}
                className="m-0 text-foreground"
                style={{
                  ...beforeStyle,
                  width,
                  maxWidth: "100%",
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "#1c1917",
                }}
              >
                {text}
              </p>
            </div>
          </figure>

          {/* After */}
          <figure className="space-y-2 rounded-lg border border-primary/30 bg-background p-3">
            <figcaption className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                After (with properties)
              </span>
              <Badge variant="outline" className="font-mono text-[9px]">
                balance:{" "}
                <span className={balanceColor(afterLines.balance)}>
                  {afterLines.balance}
                </span>
              </Badge>
            </figcaption>
            <div
              className="overflow-hidden rounded-md bg-white p-3"
              style={{ width: "100%" }}
            >
              <p
                ref={afterRef}
                className="m-0 text-foreground"
                style={{
                  ...afterStyle,
                  width,
                  maxWidth: "100%",
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "#1c1917",
                }}
                lang={afterLang}
              >
                {text}
              </p>
            </div>
          </figure>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Balance score: ratio of the narrowest full line to the widest
          (excluding the final line, which is normally short). Higher = more
          even line widths.
        </p>
      </div>

      {/* ── Controls ────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Controls
        </span>

        {/* text-wrap radio group */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            text-wrap
          </Label>
          <RadioGroup
            value={state.textWrap}
            onValueChange={(v) => patch("textWrap", v as TextWrap)}
            className="grid grid-cols-2 gap-2 sm:grid-cols-5"
          >
            {TEXT_WRAP_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                htmlFor={`tw-${opt.value}`}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-2 transition-all",
                  state.textWrap === opt.value
                    ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-muted/30",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem
                    id={`tw-${opt.value}`}
                    value={opt.value}
                    className="size-3.5"
                  />
                  <span className="font-mono text-xs">{opt.label}</span>
                </div>
                {opt.baseline ? (
                  <span className="text-[9px] text-muted-foreground">
                    {opt.baseline}
                  </span>
                ) : null}
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* text-wrap-mode + remaining selects */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* text-wrap-mode as a switch (only wrap/nowrap) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                text-wrap-mode
              </Label>
              <Badge variant="outline" className="font-mono text-[9px] text-muted-foreground">
                longhand
              </Badge>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border p-2">
              <Switch
                checked={state.textWrapMode === "wrap"}
                onCheckedChange={(v) =>
                  patch("textWrapMode", v ? "wrap" : "nowrap")
                }
                aria-label="Toggle text-wrap-mode between wrap and nowrap"
              />
              <span className="font-mono text-xs">{state.textWrapMode}</span>
            </div>
          </div>

          <SelectRow
            label="line-break"
            value={state.lineBreak}
            options={LINE_BREAK_OPTIONS}
            onChange={(v) => patch("lineBreak", v)}
          />

          <SelectRow
            label="word-break"
            value={state.wordBreak}
            options={WORD_BREAK_OPTIONS}
            onChange={(v) => patch("wordBreak", v)}
          />

          <SelectRow
            label="overflow-wrap"
            value={state.overflowWrap}
            options={OVERFLOW_WRAP_OPTIONS}
            onChange={(v) => patch("overflowWrap", v)}
          />

          <SelectRow
            label="hyphens"
            value={state.hyphens}
            options={HYPHENS_OPTIONS}
            onChange={(v) => patch("hyphens", v)}
            badge={state.hyphens === "auto" ? "needs lang" : undefined}
          />

          <SelectRow
            label="hanging-punctuation"
            value={state.hangingPunctuation}
            options={HANGING_PUNCTUATION_OPTIONS}
            onChange={(v) => patch("hangingPunctuation", v)}
            badge={
              state.hangingPunctuation !== "none" ? "Safari only" : undefined
            }
          />

          <SelectRow
            label="text-align"
            value={state.textAlign}
            options={TEXT_ALIGN_OPTIONS}
            onChange={(v) => patch("textAlign", v)}
          />
        </div>
      </div>

      {/* ── Presets ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5" />
          Presets
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-1 rounded-lg border bg-card p-2.5 text-left transition-all",
                  isActive
                    ? "border-primary/60 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-muted/30",
                )}
                aria-label={`Apply ${preset.name} preset`}
                aria-pressed={isActive}
              >
                <span className="text-[11px] font-semibold text-foreground">
                  {preset.name}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Generated CSS ───────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated CSS
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              copied
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-primary/10 text-primary hover:bg-primary/20",
            )}
            aria-label={
              copied ? "CSS copied to clipboard" : "Copy generated CSS"
            }
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground/80">
          <code>{generatedCss}</code>
        </pre>
      </div>

      {/* ── Browser support per property ────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Globe className="size-3.5" />
          Browser Support by Property
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
            <code className="font-mono text-[11px]">text-wrap: balance</code>
            <div className="flex gap-1">
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px]">
                Baseline 2024
              </Badge>
              <Badge variant="secondary" className="font-mono text-[9px]">
                C 114+
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
            <code className="font-mono text-[11px]">text-wrap: pretty</code>
            <div className="flex gap-1">
              <Badge variant="secondary" className="font-mono text-[9px]">
                C 117+
              </Badge>
              <Badge variant="secondary" className="font-mono text-[9px]">
                S 17.4+
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
            <code className="font-mono text-[11px]">text-wrap: stable</code>
            <div className="flex gap-1">
              <Badge variant="secondary" className="font-mono text-[9px]">
                C 130+
              </Badge>
              <Badge variant="secondary" className="font-mono text-[9px]">
                F 130+
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
            <code className="font-mono text-[11px]">hyphens: auto</code>
            <div className="flex gap-1">
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px]">
                Baseline 2023
              </Badge>
              <Badge variant="secondary" className="font-mono text-[9px]">
                All
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
            <code className="font-mono text-[11px]">word-break</code>
            <div className="flex gap-1">
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px]">
                Baseline
              </Badge>
              <Badge variant="secondary" className="font-mono text-[9px]">
                All
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
            <code className="font-mono text-[11px]">hanging-punctuation</code>
            <div className="flex gap-1">
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px]">
                Limited
              </Badge>
              <Badge variant="secondary" className="font-mono text-[9px]">
                S only
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          <code className="font-mono">C</code> = Chrome / Edge ·{" "}
          <code className="font-mono">S</code> = Safari ·{" "}
          <code className="font-mono">F</code> = Firefox. Version numbers are
          the first release with unprefixed support.
        </p>
      </div>
    </div>
  );
}
