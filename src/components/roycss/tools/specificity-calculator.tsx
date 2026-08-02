"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Trash2,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * SpecificityCalculator — a self-contained CSS specificity scoring tool.
 *
 * Paste a list of CSS selectors (one per line, or comma-separated) and the tool
 * computes the standard (a, b, c) specificity tuple for each:
 *   - a = ID selectors              (#id)
 *   - b = class / attribute / pseudo-class selectors  (.x, [x], :hover)
 *   - c = type / pseudo-element selectors             (div, ::before)
 *
 * Special functional pseudo-classes:
 *   - :where(...)  contributes 0 to the score
 *   - :is(...) / :not(...) contribute the MAX specificity of their inner selectors
 *
 * The integer score `a*100 + b*10 + c` is shown for ranking readability, but
 * the TRUE sort order uses tuple comparison (the integer form breaks down once
 * any component exceeds 9 — e.g. 11 classes ties with 1 id + 1 class).
 *
 * Limitations (v1):
 *   - Commas inside :not() / :is() / :where() are handled correctly because
 *     the splitter tracks paren/bracket depth; commas inside attribute
 *     selectors `[a="x,y"]` are also handled. However, an unescaped top-level
 *     comma is always treated as a selector-list separator.
 *   - Namespaced type selectors (`svg|circle`) are counted as a single type.
 *   - Legacy single-colon pseudo-elements (`:before`, `:after`, `:first-line`,
 *     `:first-letter`) are recognised as type selectors (c), per CSS spec.
 */

interface Specificity {
  a: number;
  b: number;
  c: number;
}

interface ParsedSelector {
  /** Original (trimmed) selector text. */
  selector: string;
  /** Computed specificity tuple. */
  spec: Specificity;
  /** `a*100 + b*10 + c` — readability only, NOT used for true ranking. */
  score: number;
}

const LEGACY_PSEUDO_ELEMENTS = new Set([
  "before",
  "after",
  "first-line",
  "first-letter",
]);

/** Strip /* ... *​/ comments (including multiline). */
function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Test for an identifier character: [A-Za-z0-9_-] plus non-ASCII. */
function isIdentChar(ch: string): boolean {
  return /[\w-]/.test(ch);
}

/**
 * Read the contents of a balanced parenthesised group, starting at `s[i]`
 * which MUST be '('. Returns the inner substring (excluding the outer parens).
 * Does NOT mutate `i` — use `skipParens` for that.
 */
function readParens(s: string, i: number): string {
  if (s[i] !== "(") return "";
  let depth = 0;
  let j = i;
  const n = s.length;
  while (j < n) {
    const ch = s[j];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return s.slice(i + 1, j);
    } else if (ch === '"' || ch === "'") {
      const quote = ch;
      j++;
      while (j < n && s[j] !== quote) j++;
    }
    j++;
  }
  return s.slice(i + 1); // unbalanced — return what we have
}

/**
 * Return the index immediately after the closing ')' that matches the '(' at
 * `s[i]`. If unbalanced, returns `s.length`.
 */
function skipParens(s: string, i: number): number {
  if (s[i] !== "(") return i;
  let depth = 0;
  let j = i;
  const n = s.length;
  while (j < n) {
    const ch = s[j];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return j + 1;
    } else if (ch === '"' || ch === "'") {
      const quote = ch;
      j++;
      while (j < n && s[j] !== quote) j++;
    }
    j++;
  }
  return n;
}

/** Compare two specificity tuples. Returns >0 if x>y, <0 if x<y, 0 if equal. */
function compareSpec(x: Specificity, y: Specificity): number {
  if (x.a !== y.a) return x.a - y.a;
  if (x.b !== y.b) return x.b - y.b;
  return x.c - y.c;
}

/**
 * Split a selector list on top-level commas — commas inside (), [], or quoted
 * strings are preserved. Used both for the user input and for the inner
 * arguments of :is() / :not() / :where().
 */
function splitTopLevelCommas(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  let i = 0;
  const n = input.length;
  while (i < n) {
    const ch = input[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      current += ch;
      i++;
      while (i < n) {
        current += input[i];
        if (input[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (ch === "(" || ch === "[") {
      depth++;
      current += ch;
    } else if (ch === ")" || ch === "]") {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (ch === "," && depth === 0) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
    i++;
  }
  out.push(current);
  return out.map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Core recursive specificity computation for a single selector string. */
function computeSpecificity(input: string): Specificity {
  const s = stripComments(input).trim();
  let a = 0;
  let b = 0;
  let c = 0;
  let i = 0;
  const n = s.length;

  while (i < n) {
    const ch = s[i];

    if (ch === "#") {
      a++;
      i++;
      while (i < n && isIdentChar(s[i])) i++;
    } else if (ch === ".") {
      b++;
      i++;
      while (i < n && isIdentChar(s[i])) i++;
    } else if (ch === "[") {
      b++;
      i++;
      // Skip until matching ], honouring quoted strings.
      while (i < n && s[i] !== "]") {
        if (s[i] === '"' || s[i] === "'") {
          const quote = s[i];
          i++;
          while (i < n && s[i] !== quote) i++;
          if (i < n) i++;
        } else {
          i++;
        }
      }
      if (i < n) i++; // consume ']'
    } else if (ch === ":") {
      if (s[i + 1] === ":") {
        // pseudo-element (::name)
        c++;
        i += 2;
        while (i < n && isIdentChar(s[i])) i++;
        if (i < n && s[i] === "(") i = skipParens(s, i);
      } else {
        // pseudo-class (:name or :name(args))
        i++;
        let name = "";
        while (i < n && isIdentChar(s[i])) {
          name += s[i];
          i++;
        }
        if (i < n && s[i] === "(") {
          const inner = readParens(s, i);
          const after = skipParens(s, i);
          const lowerName = name.toLowerCase();
          if (lowerName === "where") {
            // :where() contributes 0 to all components — do nothing.
          } else if (
            lowerName === "is" ||
            lowerName === "not" ||
            lowerName === "matches"
          ) {
            // contribute MAX specificity of inner selector list
            const innerList = splitTopLevelCommas(inner);
            let maxA = 0;
            let maxB = 0;
            let maxC = 0;
            for (const innerSel of innerList) {
              const sub = computeSpecificity(innerSel);
              if (compareSpec(sub, { a: maxA, b: maxB, c: maxC }) > 0) {
                maxA = sub.a;
                maxB = sub.b;
                maxC = sub.c;
              }
            }
            a += maxA;
            b += maxB;
            c += maxC;
          } else {
            // other functional pseudo-class (:nth-child, :has, :dir, ...)
            // — counts as a single pseudo-class (b). The arguments do not
            // add specificity (with the rare exception of :nth-child(an+b of S)
            // which is intentionally not modelled in v1).
            b++;
          }
          i = after;
        } else {
          // bare pseudo-class — but watch for legacy pseudo-elements
          if (LEGACY_PSEUDO_ELEMENTS.has(name.toLowerCase())) {
            c++;
          } else {
            b++;
          }
        }
      }
    } else if (ch === "*") {
      // universal selector — contributes nothing
      i++;
    } else if (
      ch === " " ||
      ch === "\t" ||
      ch === "\n" ||
      ch === "\r" ||
      ch === "+" ||
      ch === ">" ||
      ch === "~"
    ) {
      // combinators — ignore
      i++;
    } else if (ch === "|" && s[i + 1] === "|") {
      // column combinator || — ignore
      i += 2;
    } else if (isIdentChar(ch) || ch === "\\") {
      // type selector (possibly namespace-prefixed: foo|bar counts as ONE type)
      c++;
      while (i < n && isIdentChar(s[i])) i++;
      // skip namespaced suffix: |bar
      if (i < n && s[i] === "|" && s[i + 1] !== "|") {
        i++;
        while (i < n && isIdentChar(s[i])) i++;
      }
    } else {
      // any other stray character — ignore
      i++;
    }
  }

  return { a, b, c };
}

/**
 * Parse a textarea blob into an array of ParsedSelector records. Selectors may
 * be separated by newlines and/or top-level commas. Returns the count of
 * skipped (empty or whitespace-only) fragments for UI feedback.
 */
function parseSelectors(raw: string): {
  results: ParsedSelector[];
  skipped: number;
} {
  const cleaned = stripComments(raw);
  // First split by newlines, then by top-level commas on each line.
  const lines = cleaned.split(/\r?\n/);
  const fragments: string[] = [];
  for (const line of lines) {
    for (const piece of splitTopLevelCommas(line)) {
      fragments.push(piece);
    }
  }

  const results: ParsedSelector[] = [];
  let skipped = 0;
  for (const frag of fragments) {
    const selector = frag.trim();
    if (selector.length === 0) {
      skipped++;
      continue;
    }
    const spec = computeSpecificity(selector);
    const score = spec.a * 100 + spec.b * 10 + spec.c;
    results.push({ selector, spec, score });
  }
  return { results, skipped };
}

const EXAMPLE_SELECTORS = `#nav .item
div.card:hover
ul li a.active
button[type=submit]::after
.menu > .item
#sidebar .widget .title
:is(.btn, #cta):hover
*:where(.x) .y`;

const EXAMPLE_PARSERS: { selector: string; spec: Specificity }[] = [
  { selector: "#main", spec: { a: 1, b: 0, c: 0 } },
  { selector: ".card", spec: { a: 0, b: 1, c: 0 } },
  { selector: "div", spec: { a: 0, b: 0, c: 1 } },
  { selector: "[type=text]", spec: { a: 0, b: 1, c: 0 } },
  { selector: ":hover", spec: { a: 0, b: 1, c: 0 } },
  { selector: "::before", spec: { a: 0, b: 0, c: 1 } },
  { selector: "#nav .item", spec: { a: 1, b: 1, c: 0 } },
  { selector: "ul li a.active", spec: { a: 0, b: 1, c: 3 } },
];

function specToTuple(spec: Specificity): string {
  return `(${spec.a}, ${spec.b}, ${spec.c})`;
}

export function SpecificityCalculator() {
  const [input, setInput] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [copied, setCopied] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  const { results, skipped } = useMemo(() => parseSelectors(input), [input]);

  const sorted = useMemo(() => {
    const copy = [...results];
    copy.sort((x, y) =>
      sortAsc ? compareSpec(x.spec, y.spec) : compareSpec(y.spec, x.spec)
    );
    return copy;
  }, [results, sortAsc]);

  const highest = useMemo(() => {
    if (results.length === 0) return null;
    return results.reduce((max, r) =>
      compareSpec(r.spec, max.spec) > 0 ? r : max
    );
  }, [results]);

  const lowest = useMemo(() => {
    if (results.length === 0) return null;
    return results.reduce((min, r) =>
      compareSpec(r.spec, min.spec) < 0 ? r : min
    );
  }, [results]);

  const maxScore = useMemo(() => {
    if (sorted.length === 0) return 1;
    return Math.max(1, ...sorted.map((r) => r.score));
  }, [sorted]);

  const handleLoadExample = useCallback(() => {
    setInput(EXAMPLE_SELECTORS);
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (sorted.length === 0) return;
    const lines = [
      `# CSS Specificity Report`,
      `Selectors analyzed: ${sorted.length}`,
      highest ? `Highest: ${specToTuple(highest.spec)}` : "",
      lowest ? `Lowest:  ${specToTuple(lowest.spec)}` : "",
      "",
      ...sorted.map(
        (r) =>
          `${specToTuple(r.spec).padEnd(12)} ${String(r.score).padStart(4)}  ${r.selector}`
      ),
    ].filter((l) => l.length >= 0);
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [sorted, highest, lowest]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Calculator className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            CSS Specificity Calculator
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Paste selectors (one per line, or comma-separated) and rank them by specificity.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label
          htmlFor="specificity-input"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          Selectors
        </label>
        <Textarea
          id="specificity-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"#nav .item\ndiv.card:hover\nul li a.active"}
          rows={5}
          spellCheck={false}
          className="font-mono text-sm leading-relaxed resize-y scrollbar-thin"
          aria-describedby="specificity-help"
        />
        <p id="specificity-help" className="text-[11px] text-muted-foreground">
          One selector per line, or comma-separated. Commas inside{" "}
          <code className="font-mono">:not()</code>,{" "}
          <code className="font-mono">:is()</code> and attribute values are
          preserved.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="default" onClick={handleLoadExample}>
          <Sparkles className="size-3.5" />
          Load example
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClear}
          disabled={input.length === 0}
        >
          <Trash2 className="size-3.5" />
          Clear
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          disabled={sorted.length === 0}
          aria-label="Copy results summary to clipboard"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copied!" : "Copy results"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSortAsc((v) => !v)}
          disabled={sorted.length === 0}
          aria-label={
            sortAsc ? "Currently ascending — switch to descending" : "Currently descending — switch to ascending"
          }
          className="ml-auto"
        >
          <ArrowUpDown className="size-3.5" />
          {sortAsc ? "Ascending" : "Descending"}
        </Button>
      </div>

      {/* Summary */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{sorted.length}</span>{" "}
            selector{sorted.length === 1 ? "" : "s"} analyzed
          </span>
          <span className="text-muted-foreground/40" aria-hidden>·</span>
          {highest && (
            <span className="text-muted-foreground">
              Highest:{" "}
              <Badge variant="secondary" className="ml-1 font-mono">
                {specToTuple(highest.spec)}
              </Badge>
            </span>
          )}
          <span className="text-muted-foreground/40" aria-hidden>·</span>
          {lowest && (
            <span className="text-muted-foreground">
              Lowest:{" "}
              <Badge variant="outline" className="ml-1 font-mono">
                {specToTuple(lowest.spec)}
              </Badge>
            </span>
          )}
          {skipped > 0 && (
            <>
              <span className="text-muted-foreground/40" aria-hidden>·</span>
              <span className="text-amber-600 dark:text-amber-400">
                Skipped {skipped} empty/invalid line{skipped === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
      )}

      {/* Results */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin rounded-lg border border-border/60 bg-card/40">
        <AnimatePresence mode="popLayout" initial={false}>
          {sorted.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center"
            >
              <div className="grid size-12 place-items-center rounded-full bg-muted/50 text-muted-foreground">
                <Calculator className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No selectors yet
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Paste your CSS selectors above, or click{" "}
                <span className="font-medium text-primary">Load example</span>{" "}
                to see how specificity is scored.
              </p>
            </motion.div>
          ) : (
            <motion.ul
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="divide-y divide-border/50"
            >
              {sorted.map((r) => {
                const pct = Math.max(
                  6,
                  Math.round((r.score / maxScore) * 100)
                );
                const isTop = highest && compareSpec(r.spec, highest.spec) === 0;
                return (
                  <motion.li
                    key={r.selector}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isTop && (
                        <span
                          aria-hidden
                          className="inline-block size-1.5 rounded-full bg-primary shrink-0"
                          title="Highest specificity"
                        />
                      )}
                      <code className="font-mono text-sm text-foreground truncate" title={r.selector}>
                        {r.selector}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={isTop ? "default" : "secondary"}
                        className="font-mono tabular-nums"
                      >
                        {specToTuple(r.spec)}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums w-9 text-right">
                        {r.score}
                      </span>
                    </div>
                    <div className="h-1.5 w-full sm:w-24 sm:shrink-0 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* How specificity works */}
      <Collapsible open={howOpen} onOpenChange={setHowOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="size-3.5" />
              How specificity works
            </span>
            <ChevronDown
              className={`size-4 transition-transform duration-200 ${
                howOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3 text-sm text-muted-foreground">
            <p>
              Specificity is a tuple <code className="font-mono text-foreground">(a, b, c)</code>{" "}
              the browser uses to decide which CSS rule wins when multiple target the same element.
            </p>
            <ul className="space-y-1.5">
              <li>
                <Badge variant="secondary" className="font-mono mr-2">a</Badge>
                ID selectors — <code className="font-mono text-foreground">#main</code>
              </li>
              <li>
                <Badge variant="secondary" className="font-mono mr-2">b</Badge>
                Class, attribute &amp; pseudo-class selectors —{" "}
                <code className="font-mono text-foreground">.card</code>,{" "}
                <code className="font-mono text-foreground">[type=text]</code>,{" "}
                <code className="font-mono text-foreground">:hover</code>
              </li>
              <li>
                <Badge variant="secondary" className="font-mono mr-2">c</Badge>
                Type &amp; pseudo-element selectors —{" "}
                <code className="font-mono text-foreground">div</code>,{" "}
                <code className="font-mono text-foreground">::before</code>
              </li>
            </ul>
            <p>
              <code className="font-mono text-foreground">:where()</code> contributes{" "}
              <strong className="text-foreground">0</strong>;{" "}
              <code className="font-mono text-foreground">:is()</code> and{" "}
              <code className="font-mono text-foreground">:not()</code> take the{" "}
              <strong className="text-foreground">max</strong> of their inner
              selectors. The universal selector{" "}
              <code className="font-mono text-foreground">*</code> and combinators
              (<code className="font-mono text-foreground">&gt; + ~</code>) add nothing.
            </p>
            <div className="rounded-md border border-border/50 bg-background/60 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-2.5 py-1.5">Selector</th>
                    <th className="text-center font-medium px-2.5 py-1.5">Tuple</th>
                    <th className="text-left font-medium px-2.5 py-1.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {EXAMPLE_PARSERS.map((ex) => (
                    <tr key={ex.selector} className="border-t border-border/40">
                      <td className="px-2.5 py-1.5 text-foreground">{ex.selector}</td>
                      <td className="px-2.5 py-1.5 text-center tabular-nums text-foreground">
                        {specToTuple(ex.spec)}
                      </td>
                      <td className="px-2.5 py-1.5 text-muted-foreground text-[11px] font-sans">
                        {ex.spec.a > 0 && "has ID"}
                        {ex.spec.a > 0 && (ex.spec.b > 0 || ex.spec.c > 0) ? ", " : ""}
                        {ex.spec.b > 0 && `${ex.spec.b} class/attr/pseudo-class`}
                        {ex.spec.b > 0 && ex.spec.c > 0 ? ", " : ""}
                        {ex.spec.c > 0 && `${ex.spec.c} type/pseudo-element`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px]">
              The integer score <code className="font-mono text-foreground">a&times;100 + b&times;10 + c</code>{" "}
              is shown for quick readability, but the real ranking uses tuple
              comparison (the integer form mis-ranks once any component exceeds 9).
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
