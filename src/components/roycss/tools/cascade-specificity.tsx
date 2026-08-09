"use client";

/**
 * CascadeSpecificityExplorer — a self-contained CSS Cascade & Specificity
 * explorer.
 *
 * The CSS cascade resolves competing declarations for a single element in a
 * well-defined order:
 *
 *   1. Origin & Importance — author < user < user-agent (per origin),
 *      and `!important` inverts each origin's order.
 *   2. Layers              — unlayered > later-declared layer > earlier.
 *   3. Specificity         — (a, b, c) tuple where a=IDs, b=classes/attrs/
 *                            pseudo-classes, c=types/pseudo-elements.
 *   4. Order of appearance — last one wins when everything above ties.
 *
 * This tool lets you paste a stylesheet, see each rule parsed and ranked by
 * specificity, pick a target selector, and read a step-by-step explanation
 * of which rule wins and why.
 *
 * Features:
 *   - Paste CSS rules in a textarea; rules are parsed (brace-aware) into
 *     selectors + declarations + `!important` flags.
 *   - Each rule is shown as a bar with its (a, b, c) specificity score and
 *     a width proportional to its integer score (a·100 + b·10 + c, used for
 *     display only — true ranking uses tuple comparison).
 *   - Pick a target selector from a dropdown; matching candidates (rules
 *     whose selector includes the target as a substring) are filtered and
 *     the winner is highlighted with a full cascade-step explanation.
 *   - Optional inline-style field demonstrates how inline (1,0,0,0) beats
 *     external normal rules and how `!important` flips the order.
 *   - Three preset scenarios: specificity war, `!important` override,
 *     inline vs external.
 *   - Educational notes for each cascade factor.
 *
 * Specificity parsing handles `:where(...)` (contributes 0) and counts
 * `#id`, `.class`, `[attr]`, `:pseudo-class`, `tag`, `::pseudo-element`.
 * (`:is(...)` / `:not(...)` are approximated — their inner selectors are
 * counted, which is a slight overcount for `:not(...)` per spec but a
 * reasonable simplification for an educational tool.)
 *
 * TS strict, no `any`, no `console.log`. Self-contained, responsive within
 * `max-w-2xl`.
 */

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Scale,
  Copy,
  Check,
  Sparkles,
  Trash2,
  Trophy,
  Info,
  Layers as LayersIcon,
  Crown,
  ArrowDown,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const PRESET_WAR = `/* specificity war — same property, escalating selectors */
.card { color: gray; }
div.card { color: brown; }
.list .card { color: olive; }
.list .card.special { color: teal; }
#main .card { color: purple; }
#main .card.special { color: green; }`;

const PRESET_IMPORTANT = `/* !important beats higher specificity */
#main nav .item.active { color: red; }
.item { color: green !important; }
.item.active { color: blue; }`;

const PRESET_INLINE = `/* inline beats external (normal) */
div { color: red; }
#main div { color: blue; }
#main div.card { color: green; }`;

interface Preset {
  id: string;
  label: string;
  description: string;
  css: string;
  target: string;
  inline: string;
}

const PRESETS: Preset[] = [
  {
    id: "war",
    label: "Specificity war",
    description: "Same property, escalating selectors — highest (a,b,c) wins.",
    css: PRESET_WAR,
    target: ".card",
    inline: "",
  },
  {
    id: "important",
    label: "!important override",
    description:
      "A low-specificity rule with !important beats a high-specificity normal rule.",
    css: PRESET_IMPORTANT,
    target: ".item",
    inline: "",
  },
  {
    id: "inline",
    label: "Inline vs external",
    description:
      "Inline styles (1,0,0,0) beat any external normal selector — only !important can override.",
    css: PRESET_INLINE,
    target: "div",
    inline: "color: orange;",
  },
];

const DEFAULT_PRESET = PRESETS[0]!;

// ============================================================
// Types
// ============================================================

interface Specificity {
  a: number;
  b: number;
  c: number;
}

interface ParsedDecl {
  property: string;
  value: string;
  important: boolean;
}

interface ParsedRule {
  id: string;
  selector: string;
  declarations: ParsedDecl[];
  hasImportant: boolean;
  specificity: Specificity;
  /** Source-order index (0 = first declared). */
  order: number;
}

interface InlineStyle {
  declarations: ParsedDecl[];
}

// ============================================================
// Specificity computation
// ============================================================

/**
 * Strip `:where(...)` groups (including nested parens) — they contribute 0
 * to specificity per CSS Selectors Level 4.
 */
function stripWhere(input: string): string {
  let out = "";
  let i = 0;
  const n = input.length;
  while (i < n) {
    if (input.startsWith(":where(", i)) {
      // Skip the :where(...) group entirely (track paren depth).
      let depth = 0;
      while (i < n) {
        const ch = input[i]!;
        if (ch === "(") depth++;
        else if (ch === ")") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      // Emit a placeholder so the tokenizer doesn't merge neighbouring tokens.
      out += " :where ";
      continue;
    }
    out += input[i];
    i++;
  }
  return out;
}

function computeSpecificity(selector: string): Specificity {
  const s = stripWhere(selector);
  let a = 0;
  let b = 0;
  let c = 0;

  // IDs: #name
  const idMatches = s.match(/#[A-Za-z_][\w-]*/g) ?? [];
  a = idMatches.length;
  let rest = s.replace(/#[A-Za-z_][\w-]*/g, " ");

  // Pseudo-elements: ::name (count before pseudo-classes; double-colon)
  const pseudoElMatches = rest.match(/::[A-Za-z_][\w-]*/g) ?? [];
  c += pseudoElMatches.length;
  rest = rest.replace(/::[A-Za-z_][\w-]*/g, " ");

  // Classes: .name
  const classMatches = rest.match(/\.[A-Za-z_][\w-]*/g) ?? [];
  b += classMatches.length;
  rest = rest.replace(/\.[A-Za-z_][\w-]*/g, " ");

  // Attribute selectors: [attr], [attr=value], etc.
  const attrMatches = rest.match(/\[[^\]]*\]/g) ?? [];
  b += attrMatches.length;
  rest = rest.replace(/\[[^\]]*\]/g, " ");

  // Pseudo-classes: :name (single colon, not double). Includes functional
  // pseudo-classes like :not(...), :is(...), :has(...), :nth-child(...).
  // We treat their *inner* selectors as part of the selector for counting
  // (an approximation — :is/:not should take the MAX, :where takes 0 and
  // we already stripped it).
  const pseudoClassMatches = rest.match(/:[A-Za-z_][\w-]*(\([^)]*\))?/g) ?? [];
  b += pseudoClassMatches.length;
  rest = rest.replace(/:[A-Za-z_][\w-]*(\([^)]*\))?/g, " ");

  // Type selectors: a leading identifier or one following a combinator.
  // Match standalone words that are not already consumed.
  const typeMatches = rest.match(/[A-Za-z][\w-]*/g) ?? [];
  c += typeMatches.length;

  return { a, b, c };
}

/** Tuple comparison: >0 if x>y, <0 if x<y, 0 if equal. */
function compareSpec(x: Specificity, y: Specificity): number {
  if (x.a !== y.a) return x.a - y.a;
  if (x.b !== y.b) return x.b - y.b;
  return x.c - y.c;
}

/** Integer score for display only (NOT used for true ranking). */
function specScore(s: Specificity): number {
  return s.a * 100 + s.b * 10 + s.c;
}

function specTuple(s: Specificity): string {
  return `(${s.a}, ${s.b}, ${s.c})`;
}

// ============================================================
// CSS parser (brace-aware, comment-stripping)
// ============================================================

function parseDeclarations(body: string): ParsedDecl[] {
  return body
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s): ParsedDecl | null => {
      const colonIdx = s.indexOf(":");
      if (colonIdx === -1) return null;
      const property = s.slice(0, colonIdx).trim();
      let value = s.slice(colonIdx + 1).trim();
      let important = false;
      const importantMatch = /!\s*important$/i.exec(value);
      if (importantMatch) {
        important = true;
        value = value.slice(0, importantMatch.index).trim();
      }
      return { property, value, important };
    })
    .filter((d): d is ParsedDecl => d !== null && d.property.length > 0);
}

function parseCss(input: string): ParsedRule[] {
  const cleaned = input.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: ParsedRule[] = [];
  let order = 0;
  let i = 0;
  const n = cleaned.length;

  while (i < n) {
    // Skip whitespace.
    while (i < n && /\s/.test(cleaned[i]!)) i++;
    if (i >= n) break;

    // Find the opening brace.
    const selStart = i;
    while (i < n && cleaned[i] !== "{") i++;
    if (i >= n) break;
    const selector = cleaned.slice(selStart, i).trim();
    i++; // consume `{`
    if (i >= n) break;

    // Find the closing brace.
    const bodyStart = i;
    while (i < n && cleaned[i] !== "}") i++;
    const body = cleaned.slice(bodyStart, i).trim();
    if (i < n) i++; // consume `}`

    if (!selector) continue;

    const declarations = parseDeclarations(body);
    const hasImportant = declarations.some((d) => d.important);
    const specificity = computeSpecificity(selector);
    rules.push({
      id: `rule-${order}`,
      selector,
      declarations,
      hasImportant,
      specificity,
      order,
    });
    order++;
  }
  return rules;
}

function parseInlineStyle(input: string): InlineStyle {
  const declarations = parseDeclarations(input);
  return { declarations };
}

// ============================================================
// Cascade resolution
// ============================================================

interface CascadeCandidate {
  rule: ParsedRule | null; // null = inline style
  label: string;
  specificity: Specificity; // inline = (1,0,0,0)
  important: boolean;
  order: number; // inline = Infinity (last)
  isInline: boolean;
  property: string;
  value: string;
}

/**
 * Resolve the cascade for a given target selector + optional inline style.
 *
 * For the FIRST property that appears in any candidate, returns the sorted
 * list of candidates (winner first) and the winning candidate.
 *
 * Cascade steps applied (in order):
 *   1. Importance — !important wins over normal (within the same origin).
 *   2. Inline     — inline (1,0,0,0) > external within the same importance.
 *   3. Specificity — higher (a,b,c) wins.
 *   4. Order      — later source position wins.
 *
 * NOTE: We do not model layers (no @layer parsing in this tool) and we
 * treat all rules as author origin.
 */
function resolveCascade(
  candidates: ParsedRule[],
  inline: InlineStyle,
): {
  sorted: CascadeCandidate[];
  winner: CascadeCandidate | null;
} {
  // Pick the first property we see across all candidates + inline.
  // (Cascade is per-property, so we resolve for one property at a time.)
  const firstProp =
    inline.declarations[0]?.property ??
    candidates.flatMap((r) => r.declarations)[0]?.property ??
    null;

  if (!firstProp) return { sorted: [], winner: null };

  const pool: CascadeCandidate[] = [];

  for (const rule of candidates) {
    for (const d of rule.declarations) {
      if (d.property !== firstProp) continue;
      pool.push({
        rule,
        label: rule.selector,
        specificity: rule.specificity,
        important: d.important,
        order: rule.order,
        isInline: false,
        property: d.property,
        value: d.value,
      });
    }
  }

  for (const d of inline.declarations) {
    if (d.property !== firstProp) continue;
    pool.push({
      rule: null,
      label: `<input style="…">`,
      specificity: { a: 1, b: 0, c: 0 },
      important: d.important,
      order: Number.POSITIVE_INFINITY,
      isInline: true,
      property: d.property,
      value: d.value,
    });
  }

  // Sort: important desc → inline desc → specificity desc → order desc.
  const sorted = pool.slice().sort((x, y) => {
    if (x.important !== y.important) return x.important ? -1 : 1;
    if (x.isInline !== y.isInline) return x.isInline ? -1 : 1;
    const cmp = compareSpec(y.specificity, x.specificity);
    if (cmp !== 0) return cmp;
    return y.order - x.order;
  });

  return { sorted, winner: sorted[0] ?? null };
}

// ============================================================
// Main component
// ============================================================

export function CascadeSpecificityExplorer() {
  const [cssInput, setCssInput] = useState<string>(DEFAULT_PRESET.css);
  const [targetSelector, setTargetSelector] = useState<string>(
    DEFAULT_PRESET.target,
  );
  const [inlineInput, setInlineInput] = useState<string>(
    DEFAULT_PRESET.inline,
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [notesOpen, setNotesOpen] = useState<boolean>(false);

  // ── Parsing ────────────────────────────────────────────────────────

  const parsed = useMemo(() => parseCss(cssInput), [cssInput]);
  const inline = useMemo(
    () => parseInlineStyle(inlineInput),
    [inlineInput],
  );

  // Unique selectors for the target dropdown.
  const uniqueSelectors = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of parsed) {
      if (!seen.has(r.selector)) {
        seen.add(r.selector);
        out.push(r.selector);
      }
    }
    return out;
  }, [parsed]);

  // All rules sorted by specificity descending (for the bar chart).
  const allBySpec = useMemo(() => {
    return parsed
      .slice()
      .sort((a, b) => {
        const cmp = compareSpec(b.specificity, a.specificity);
        if (cmp !== 0) return cmp;
        return b.order - a.order;
      });
  }, [parsed]);

  const maxScore = useMemo(() => {
    if (allBySpec.length === 0) return 1;
    return Math.max(1, ...allBySpec.map((r) => specScore(r.specificity)));
  }, [allBySpec]);

  // ── Target candidates + winner ─────────────────────────────────────

  const candidates = useMemo(() => {
    if (targetSelector === "__all__") return parsed;
    return parsed.filter((r) => r.selector.includes(targetSelector));
  }, [parsed, targetSelector]);

  const resolution = useMemo(
    () => resolveCascade(candidates, inline),
    [candidates, inline],
  );

  // ── Preset loader ──────────────────────────────────────────────────

  const loadPreset = useCallback((preset: Preset) => {
    setCssInput(preset.css);
    setTargetSelector(preset.target);
    setInlineInput(preset.inline);
  }, []);

  // ── Copy ───────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssInput);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [cssInput]);

  // ── Render helpers ─────────────────────────────────────────────────

  const winnerRule = resolution.winner;
  const winnerIsInline = winnerRule?.isInline ?? false;
  const winnerTuple = winnerRule ? specTuple(winnerRule.specificity) : "";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Scale className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            Cascade &amp; Specificity Explorer
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Paste CSS rules, see each ranked by specificity, pick a target,
            and read why the winner wins.
          </p>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2.5 text-xs"
              onClick={() => loadPreset(p)}
              title={p.description}
            >
              <Sparkles className="size-3" />
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* CSS input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="cs-input"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            CSS rules
          </Label>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px] text-muted-foreground"
              onClick={() => setCssInput("")}
              disabled={cssInput.length === 0}
              aria-label="Clear CSS"
            >
              <Trash2 className="size-3" />
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[11px]"
              onClick={handleCopy}
              aria-label="Copy CSS to clipboard"
            >
              {copied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
        <Textarea
          id="cs-input"
          value={cssInput}
          onChange={(e) => setCssInput(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={`.card { color: red; }\n#main .card { color: blue; }`}
          className="font-mono text-xs leading-relaxed resize-y scrollbar-thin"
        />
      </div>

      {/* Inline style + target selector */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Inline style on target
          </Label>
          <Input
            value={inlineInput}
            onChange={(e) => setInlineInput(e.target.value)}
            placeholder="color: orange;"
            spellCheck={false}
            className="font-mono text-xs"
            aria-label="Inline style declarations"
          />
          <p className="text-[10px] text-muted-foreground">
            Treated as specificity (1, 0, 0, 0). Add{" "}
            <code className="font-mono">!important</code> to beat external{" "}
            <code className="font-mono">!important</code>.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Target selector
          </Label>
          <Select
            value={targetSelector}
            onValueChange={setTargetSelector}
          >
            <SelectTrigger className="w-full font-mono text-xs">
              <SelectValue placeholder="Pick a selector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__" className="font-mono text-xs">
                * all rules (no filter)
              </SelectItem>
              {uniqueSelectors.map((s) => (
                <SelectItem key={s} value={s} className="font-mono text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Shows rules whose selector contains the picked target as a
            substring (heuristic for &quot;could apply to the same element&quot;).
          </p>
        </div>
      </div>

      {/* Winner banner */}
      {winnerRule ? (
        <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Trophy className="size-3.5" />
            Cascade winner
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <code className="font-mono text-sm font-semibold text-foreground">
              {winnerRule.property}: {winnerRule.value}
              {winnerRule.important ? " !important" : ""}
            </code>
            <span className="text-[11px] text-muted-foreground">from</span>
            <code className="font-mono text-xs text-foreground/80">
              {winnerRule.label}
            </code>
            <Badge
              variant="outline"
              className="ml-auto font-mono text-[10px] tabular-nums"
            >
              {winnerTuple}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {winnerIsInline
              ? "Inline styles beat every external normal rule and tie-break against external !important by their own !important flag."
              : winnerRule.important
                ? `!important flips the order within author origin — this rule beats higher-specificity normal rules and inline (normal).`
                : `Wins by specificity ${winnerTuple} (and source order if specificity ties).`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
          No declarations found. Add a CSS rule above to resolve the cascade.
        </div>
      )}

      {/* Cascade factors panel */}
      <div className="grid gap-2 sm:grid-cols-2">
        <CascadeFactor
          step={1}
          title="Origin & Importance"
          body={
            <>
              All rules here are <code className="font-mono">author</code>{" "}
              origin. <code className="font-mono">!important</code> flips the
              order within an origin: important author rules beat normal
              author rules (and normal inline).
            </>
          }
          highlight={winnerRule?.important === true && !winnerRule.isInline}
        />
        <CascadeFactor
          step={2}
          title="Cascade layers"
          body={
            <>
              <code className="font-mono">@layer</code> reorders the cascade:
              unlayered wins over layered, later layers win over earlier.
              This tool does not parse layers — assume all rules unlayered.
            </>
          }
          icon={<LayersIcon className="size-3.5" />}
        />
        <CascadeFactor
          step={3}
          title="Specificity"
          body={
            <>
              The (a, b, c) tuple: <code className="font-mono">a</code> = ID
              count, <code className="font-mono">b</code> = class / attribute
              / pseudo-class count, <code className="font-mono">c</code> =
              type / pseudo-element count.{" "}
              <code className="font-mono">:where()</code> contributes 0.
            </>
          }
          highlight={!winnerRule?.isInline && !(winnerRule?.important === true)}
          value={winnerTuple}
        />
        <CascadeFactor
          step={4}
          title="Order of appearance"
          body={
            <>
              When origin, importance, layers, and specificity all tie, the
              rule declared <em>last</em> in source order wins. Inline styles
              are treated as appearing last.
            </>
          }
          icon={<ArrowDown className="size-3.5" />}
        />
      </div>

      {/* All rules by specificity (bar chart) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            All rules ranked by specificity
          </div>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {parsed.length} rule{parsed.length === 1 ? "" : "s"}
          </Badge>
        </div>
        {allBySpec.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
            No rules parsed yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {allBySpec.map((r) => {
              const score = specScore(r.specificity);
              const pct = Math.max(4, Math.round((score / maxScore) * 100));
              const isWinner =
                winnerRule !== null &&
                winnerRule.rule !== null &&
                winnerRule.rule.id === r.id;
              const isCandidate = candidates.some((c) => c.id === r.id);
              return (
                <li
                  key={r.id}
                  className={cn(
                    "rounded-md border px-2 py-1.5",
                    isWinner
                      ? "border-primary/50 bg-primary/5"
                      : isCandidate
                        ? "border-border/60 bg-card/40"
                        : "border-border/40 bg-background/40 opacity-70",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isWinner && (
                      <Crown className="size-3.5 text-primary shrink-0" />
                    )}
                    <code className="font-mono text-[11px] text-foreground truncate flex-1 min-w-0">
                      {r.selector}
                    </code>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] tabular-nums shrink-0"
                    >
                      {specTuple(r.specificity)}
                    </Badge>
                    {r.hasImportant && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] shrink-0"
                      >
                        !important
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isWinner ? "bg-primary" : "bg-foreground/30",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Candidates for target (with cascade ranking) */}
      {resolution.sorted.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Trophy className="size-3.5" />
            Cascade resolution for &quot;
            <code className="font-mono text-foreground">
              {targetSelector === "__all__" ? "all" : targetSelector}
            </code>
            &quot;
          </div>
          <ol className="space-y-1">
            {resolution.sorted.map((c, idx) => (
              <li
                key={`${c.label}-${idx}`}
                className={cn(
                  "flex flex-wrap items-center gap-2 rounded-md border px-2 py-1.5 text-xs",
                  idx === 0
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/60 bg-card/30",
                )}
              >
                <span className="font-mono text-muted-foreground tabular-nums">
                  #{idx + 1}
                </span>
                <code className="font-mono text-foreground">
                  {c.property}: {c.value}
                  {c.important ? " !important" : ""}
                </code>
                <span className="text-muted-foreground/60">·</span>
                <code className="font-mono text-[11px] text-muted-foreground">
                  {c.label}
                </code>
                <Badge
                  variant="outline"
                  className="ml-auto font-mono text-[10px] tabular-nums"
                >
                  {specTuple(c.specificity)}
                </Badge>
                {c.important && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]"
                  >
                    !imp
                  </Badge>
                )}
                {c.isInline && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary text-[10px]"
                  >
                    inline
                  </Badge>
                )}
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-muted-foreground">
            Resolved for the first property appearing in any candidate (
            <code className="font-mono">
              {resolution.sorted[0]?.property}
            </code>
            ). Sorted by importance → inline → specificity → source order.
          </p>
        </div>
      )}

      {/* Educational notes */}
      <Collapsible
        open={notesOpen}
        onOpenChange={setNotesOpen}
        className="rounded-lg border border-border/60 bg-card/40 p-3"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Info className="size-3.5" />
              Educational notes
            </span>
            <span className="text-[10px] text-muted-foreground">
              {notesOpen ? "Hide" : "Show"}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2 text-[11px] text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">
                Origin &amp; importance:
              </span>{" "}
              The cascade has six origin/importance tiers. In author origin
              (where your CSS lives), <code className="font-mono">!important</code>{" "}
              declarations beat normal ones. User-agent stylesheets are the
              weakest; user stylesheets sit in between; author rules win by
              default. <code className="font-mono">!important</code> inverts
              each tier.
            </p>
            <p>
              <span className="font-semibold text-foreground">Layers:</span>{" "}
              <code className="font-mono">@layer</code> lets you opt into a
              strict priority order that overrides specificity. Unlayered
              rules always win over layered ones. Use the dedicated Cascade
              Layers visualizer to explore this.
            </p>
            <p>
              <span className="font-semibold text-foreground">
                Specificity:
              </span>{" "}
              Computed as a tuple{" "}
              <code className="font-mono">(a, b, c)</code>. Compare
              lexicographically: <code className="font-mono">a</code> first,
              then <code className="font-mono">b</code>, then{" "}
              <code className="font-mono">c</code>. The integer{" "}
              <code className="font-mono">a·100 + b·10 + c</code> shown here
              is for display only — it breaks down once any component exceeds
              9 (e.g. 11 classes ≠ 1 ID + 1 class).
            </p>
            <p>
              <span className="font-semibold text-foreground">
                Order of appearance:
              </span>{" "}
              The final tiebreaker. For two rules with identical importance,
              layer, and specificity, the one declared later in source order
              wins. Inline styles are treated as appearing after all external
              rules.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

interface CascadeFactorProps {
  step: number;
  title: string;
  body: ReactNode;
  icon?: ReactNode;
  highlight?: boolean;
  value?: string;
}

function CascadeFactor({
  step,
  title,
  body,
  icon,
  highlight,
  value,
}: CascadeFactorProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border/60 bg-card/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary tabular-nums">
            {step}
          </span>
          {icon}
          {title}
        </div>
        {value && (
          <Badge
            variant="outline"
            className="font-mono text-[10px] tabular-nums"
          >
            {value}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{body}</p>
    </div>
  );
}
