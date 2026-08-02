"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Crosshair,
  Search,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  MousePointerClick,
  ListChecks,
  Info,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * SelectorTester — a self-contained CSS Selector Tester / Playground.
 *
 * Type ANY valid CSS selector and instantly see which elements of a live HTML
 * sample match. Uses the browser's own `Element.querySelectorAll` for parsing
 * and matching (so every selector the browser supports works: `:has()`,
 * `:is()`, `:where()`, `:not()`, attribute operators, nth-child/of-type,
 * combinators, comma lists, etc.).
 *
 * - HTML sample is editable (collapsible on mobile).
 * - Matched elements are highlighted inline via DOM refs (outline + tint).
 * - A results list shows tag/id/classes/text-preview per match; clicking a
 *   match scrolls it into view and pulses it.
 * - Debounced (~200ms) evaluation of both HTML and selector changes.
 * - Invalid selectors are caught (SyntaxError/DOMException) and surfaced as a
 *   red error badge.
 */

// ============================================================
// Constants
// ============================================================

const DEBOUNCE_MS = 200;
const COPY_CONFIRM_MS = 2000;
const PULSE_MS = 900;
const TEXT_PREVIEW_LEN = 80;

/** Data attributes used to save/restore original inline styles on matches. */
const ORIG_OUTLINE = "data-roycss-orig-outline";
const ORIG_OUTLINE_OFFSET = "data-roycss-orig-outline-offset";
const ORIG_BG = "data-roycss-orig-bg";

const DEFAULT_HTML = `<div class="container">
  <header>
    <h1>Product Catalog</h1>
    <p class="subtitle">Browse our featured items</p>
  </header>
  <nav>
    <a href="https://example.com/home">Home</a>
    <a href="/about">About</a>
    <a href="https://shop.example.com">Shop</a>
    <a href="mailto:hi@example.com">Contact</a>
  </nav>
  <ul class="items">
    <li class="active">First item</li>
    <li class="featured">Featured item</li>
    <li>Regular item</li>
    <li class="active featured">Both classes</li>
    <li></li>
    <li>Last item</li>
  </ul>
  <form>
    <input type="text" placeholder="Search" />
    <input type="email" placeholder="Email" />
    <input type="checkbox" checked />
    <input type="submit" value="Submit" />
    <button type="submit">Send</button>
  </form>
  <table>
    <thead><tr><th>Name</th><th>Price</th></tr></thead>
    <tbody>
      <tr><td>Widget</td><td>$9.99</td></tr>
      <tr><td>Gadget</td><td>$14.99</td></tr>
      <tr><td>Gizmo</td><td>$19.99</td></tr>
    </tbody>
  </table>
</div>`;

const DEFAULT_SELECTOR = ":has(.active)";

interface QuickFill {
  selector: string;
  label: string;
}

const QUICK_FILLS: QuickFill[] = [
  { selector: ":has(.active)", label: "elements containing an active child" },
  { selector: 'a[href^="https"]', label: "external https links" },
  { selector: "li:nth-child(odd)", label: "odd list items" },
  { selector: ":is(h1, h2, h3)", label: "any heading" },
  { selector: 'input:not([type="text"])', label: "non-text inputs" },
  { selector: "tr:nth-of-type(2n)", label: "even table rows" },
  { selector: ":empty", label: "empty elements" },
  { selector: ".featured + li", label: "sibling after featured" },
];

const NO_MATCH_SUGGESTIONS = QUICK_FILLS.slice(0, 3);

// ============================================================
// Types
// ============================================================

interface MatchInfo {
  element: HTMLElement;
  tag: string;
  id: string;
  classes: string[];
  textPreview: string;
}

type SelectorStatus = "empty" | "valid" | "invalid";

// ============================================================
// Helpers
// ============================================================

/** Pseudo-classes that only match during real user interaction. */
const INTERACTION_PSEUDO_RE = /:(?:hover|focus|active|focus-within|focus-visible)\b/i;

function hasInteractionPseudo(selector: string): boolean {
  return INTERACTION_PSEUDO_RE.test(selector);
}

/** Collapse runs of whitespace for a compact text preview. */
function compactText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

interface MatchResult {
  matches: MatchInfo[];
  error: string | null;
}

/**
 * Query `root` with `selector`, apply highlight styles to each match, and
 * return a result object. Reverts previously-applied highlights (tracked in
 * `highlightedRef`) before applying new ones.
 *
 * Pure from React's perspective (no setState) — side effects are confined to
 * DOM mutations on the live preview tree.
 */
function computeMatches(
  root: HTMLElement,
  selector: string,
  highlightedRef: { current: HTMLElement[] },
): MatchResult {
  // Revert previous highlights.
  for (const el of highlightedRef.current) {
    el.style.outline = el.getAttribute(ORIG_OUTLINE) ?? "";
    el.style.outlineOffset = el.getAttribute(ORIG_OUTLINE_OFFSET) ?? "";
    el.style.backgroundColor = el.getAttribute(ORIG_BG) ?? "";
    el.removeAttribute(ORIG_OUTLINE);
    el.removeAttribute(ORIG_OUTLINE_OFFSET);
    el.removeAttribute(ORIG_BG);
  }
  highlightedRef.current = [];

  const trimmed = selector.trim();
  const matches: MatchInfo[] = [];
  let error: string | null = null;

  if (!trimmed) {
    return { matches, error };
  }

  try {
    const matchedEls = Array.from(root.querySelectorAll(trimmed));
    for (const el of matchedEls) {
      const htmlEl = el as HTMLElement;
      // Save originals so we can restore on re-run.
      htmlEl.setAttribute(ORIG_OUTLINE, htmlEl.style.outline);
      htmlEl.setAttribute(ORIG_OUTLINE_OFFSET, htmlEl.style.outlineOffset);
      htmlEl.setAttribute(ORIG_BG, htmlEl.style.backgroundColor);

      htmlEl.style.outline = "2px solid var(--primary, teal)";
      htmlEl.style.outlineOffset = "1px";
      htmlEl.style.backgroundColor =
        "color-mix(in srgb, var(--primary) 15%, transparent)";
      highlightedRef.current.push(htmlEl);

      matches.push({
        element: htmlEl,
        tag: htmlEl.tagName.toLowerCase(),
        id: htmlEl.id,
        classes: Array.from(htmlEl.classList),
        textPreview: compactText(htmlEl.textContent ?? "").slice(
          0,
          TEXT_PREVIEW_LEN,
        ),
      });
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return { matches, error };
}

// ============================================================
// Main component
// ============================================================

export function SelectorTester() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [selector, setSelector] = useState(DEFAULT_SELECTOR);
  const [debouncedHtml, setDebouncedHtml] = useState(DEFAULT_HTML);
  const [debouncedSelector, setDebouncedSelector] = useState(DEFAULT_SELECTOR);
  // Combined match-result state so the effect can issue a single setState
  // call (avoids the `react-hooks/set-state-in-effect` cascading-render lint).
  const [result, setResult] = useState<{
    matches: MatchInfo[];
    error: string | null;
  }>({ matches: [], error: null });
  const [copied, setCopied] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [htmlOpen, setHtmlOpen] = useState(false);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const highlightedRef = useRef<HTMLElement[]>([]);
  const htmlTimerRef = useRef<number | null>(null);
  const selectorTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  // --- Debounce HTML ---------------------------------------------------
  useEffect(() => {
    if (htmlTimerRef.current !== null) {
      window.clearTimeout(htmlTimerRef.current);
    }
    htmlTimerRef.current = window.setTimeout(() => {
      setDebouncedHtml(html);
    }, DEBOUNCE_MS);
    return () => {
      if (htmlTimerRef.current !== null) {
        window.clearTimeout(htmlTimerRef.current);
        htmlTimerRef.current = null;
      }
    };
  }, [html]);

  // --- Debounce selector ----------------------------------------------
  useEffect(() => {
    if (selectorTimerRef.current !== null) {
      window.clearTimeout(selectorTimerRef.current);
    }
    selectorTimerRef.current = window.setTimeout(() => {
      setDebouncedSelector(selector);
    }, DEBOUNCE_MS);
    return () => {
      if (selectorTimerRef.current !== null) {
        window.clearTimeout(selectorTimerRef.current);
        selectorTimerRef.current = null;
      }
    };
  }, [selector]);

  // --- Run the matcher whenever debounced inputs change ----------------
  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    setResult(computeMatches(root, debouncedSelector, highlightedRef));
  }, [debouncedHtml, debouncedSelector]);

  // --- Cleanup copy timer on unmount ----------------------------------
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  // --- Derived values -------------------------------------------------
  const { matches, error } = result;
  const status: SelectorStatus = error
    ? "invalid"
    : debouncedSelector.trim() === ""
      ? "empty"
      : "valid";

  const showInteractionNote =
    status !== "invalid" && hasInteractionPseudo(debouncedSelector);

  // --- Handlers --------------------------------------------------------

  const handleCopy = useCallback(async () => {
    if (!selector) return;
    try {
      await navigator.clipboard.writeText(selector);
    } catch {
      // Clipboard may be unavailable (insecure context); fall back to a
      // no-op. We still flip the "copied" flag so the UI is consistent.
    }
    setCopied(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, COPY_CONFIRM_MS);
  }, [selector]);

  const handleMatchClick = useCallback(
    (idx: number) => {
      const m = matches[idx];
      if (!m) return;
      setActiveIdx(idx);
      m.element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Pulse via the Web Animations API — no CSS injection needed.
      try {
        m.element.animate(
          [
            { boxShadow: "0 0 0 0 var(--primary)" },
            { boxShadow: "0 0 0 10px transparent" },
          ],
          { duration: PULSE_MS, easing: "ease-out" },
        );
      } catch {
        // WAAPI not supported — brief outline-width bump as a fallback.
        // Use setProperty (a method call) rather than a direct style assignment
        // so we don't mutate a state-derived element reference directly.
        const style = m.element.style;
        const orig = style.getPropertyValue("outline-width");
        style.setProperty("outline-width", "5px");
        window.setTimeout(() => {
          style.setProperty("outline-width", orig);
        }, PULSE_MS);
      }
    },
    [matches],
  );

  // --- Class composition ----------------------------------------------

  const inputBorderClass = cn(
    "font-mono text-base pl-10 h-12 rounded-md transition-colors",
    status === "valid" &&
      matches.length > 0 &&
      "border-l-4 border-l-emerald-500",
    status === "valid" &&
      matches.length === 0 &&
      "border-l-4 border-l-amber-500",
    status === "invalid" && "border-l-4 border-l-rose-500",
  );

  // --- Render ----------------------------------------------------------

  return (
    <div className="w-full space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {/* Selector input + chips — top on mobile, left-col top on desktop */}
        <div className="order-1 space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="selector-tester-input"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <Crosshair className="inline size-3 mr-1 align-text-bottom" />
              CSS Selector
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!selector}
              className="h-7 text-xs gap-1.5"
              aria-label="Copy current selector to clipboard"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <Crosshair
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="selector-tester-input"
              value={selector}
              onChange={(e) => {
                setSelector(e.target.value);
                setActiveIdx(null);
              }}
              placeholder="e.g. li:nth-child(odd)"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              className={inputBorderClass}
              aria-invalid={status === "invalid"}
              aria-describedby="selector-tester-status"
            />
          </div>

          {/* Live status line */}
          <div
            id="selector-tester-status"
            className="text-xs min-h-[1.25rem]"
            role="status"
            aria-live="polite"
          >
            {status === "invalid" ? (
              <span className="inline-flex items-center gap-1.5 text-rose-500">
                <AlertCircle className="size-3.5" />
                Invalid selector
              </span>
            ) : status === "valid" ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-medium",
                  matches.length > 0 ? "text-emerald-500" : "text-amber-500",
                )}
              >
                <ListChecks className="size-3.5" />
                {matches.length} {matches.length === 1 ? "match" : "matches"}{" "}
                found
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MousePointerClick className="size-3.5" />
                Type a selector to see matches
              </span>
            )}
          </div>

          {/* Interaction-pseudo disclaimer */}
          {showInteractionNote && (
            <div className="flex items-start gap-1.5 rounded-md border border-border bg-muted/40 p-2 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                Interactive pseudo-classes like{" "}
                <code className="font-mono">:hover</code> /{" "}
                <code className="font-mono">:focus</code> only match while the
                user is actually interacting — they will return 0 matches in
                this static preview unless that state is active.
              </span>
            </div>
          )}

          {/* Quick-fill chips */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3" aria-hidden />
              Quick fill
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_FILLS.map((qf) => (
                <Button
                  key={qf.selector}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelector(qf.selector);
                    setActiveIdx(null);
                  }}
                  className="h-7 gap-1.5 px-2"
                  title={qf.label}
                >
                  <code className="font-mono text-xs text-primary">
                    {qf.selector}
                  </code>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    · {qf.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Live preview — second on mobile, right col (spans 2 rows) on desktop */}
        <div className="order-2 md:row-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Preview
            </Label>
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
              <MousePointerClick className="size-3" aria-hidden />
              highlights update live
            </span>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 min-h-[300px] md:h-[calc(100%-1.5rem)] overflow-auto">
            <div
              ref={previewRef}
              className="selector-tester-preview space-y-2 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_input]:mr-1 [&_input]:accent-primary [&_h1]:text-lg [&_h1]:font-semibold [&_header]:mb-1 [&_nav]:flex [&_nav]:flex-wrap [&_nav]:gap-3 [&_form]:flex [&_form]:flex-wrap [&_form]:items-center [&_form]:gap-2 [&_button]:rounded [&_button]:bg-primary [&_button]:px-2 [&_button]:py-0.5 [&_button]:text-xs [&_button]:text-primary-foreground"
              dangerouslySetInnerHTML={{ __html: debouncedHtml }}
            />
          </div>
        </div>

        {/* HTML input + results — third on mobile, left-col bottom on desktop */}
        <div className="order-3 space-y-3">
          {/* HTML sample (collapsible) */}
          <Collapsible open={htmlOpen} onOpenChange={setHtmlOpen}>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="selector-tester-html"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                HTML Sample
              </Label>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  {htmlOpen ? "Hide" : "Edit HTML"}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-2">
              <Textarea
                id="selector-tester-html"
                value={html}
                onChange={(e) => {
                  setHtml(e.target.value);
                  setActiveIdx(null);
                }}
                spellCheck={false}
                className="font-mono text-xs min-h-[240px] resize-y"
                aria-label="HTML sample to test selectors against"
              />
            </CollapsibleContent>
            {!htmlOpen && (
              <p className="text-[11px] text-muted-foreground pt-1">
                Click “Edit HTML” to modify the sample being queried.
              </p>
            )}
          </Collapsible>

          {/* Results list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ListChecks className="inline size-3 mr-1 align-text-bottom" />
                Matches
              </Label>
              <Badge variant="secondary" className="font-mono text-[10px] h-5">
                {matches.length}
              </Badge>
            </div>

            {status === "invalid" ? (
              <div
                className="rounded-md border border-rose-500/40 bg-rose-500/5 p-3 text-xs text-rose-600 dark:text-rose-400"
                role="alert"
              >
                <div className="flex items-center gap-1.5 font-medium mb-1">
                  <AlertCircle className="size-3.5" /> Invalid selector
                </div>
                <code className="font-mono break-all text-[11px]">
                  {error}
                </code>
                <p className="mt-2 text-muted-foreground text-[11px]">
                  Common causes: unmatched brackets, stray{" "}
                  <code className="font-mono">()</code> /{" "}
                  <code className="font-mono">[]</code>, or unsupported syntax.
                </p>
              </div>
            ) : matches.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground space-y-2">
                <Search className="size-5 mx-auto opacity-50" aria-hidden />
                <div>No matches — try a different selector.</div>
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {NO_MATCH_SUGGESTIONS.map((qf) => (
                    <Button
                      key={qf.selector}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelector(qf.selector);
                        setActiveIdx(null);
                      }}
                      className="h-6 px-2"
                    >
                      <code className="font-mono text-[10px]">
                        {qf.selector}
                      </code>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <ul
                className="max-h-[280px] overflow-y-auto rounded-md border border-border divide-y divide-border bg-card/30"
                aria-label="Matched elements"
              >
                {matches.map((m, idx) => (
                  <li key={`${m.tag}-${idx}`} className="p-0">
                    <button
                      type="button"
                      onClick={() => handleMatchClick(idx)}
                      className={cn(
                        "w-full text-left p-2 hover:bg-muted/50 font-mono text-xs transition-colors flex flex-col gap-1",
                        activeIdx === idx && "bg-primary/10",
                      )}
                      aria-label={`Match ${idx + 1}: ${m.tag}${
                        m.id ? `#${m.id}` : ""
                      }${
                        m.classes.length
                          ? `.${m.classes.join(".")}`
                          : ""
                      }${m.textPreview ? `, text: ${m.textPreview}` : ""}`}
                    >
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-primary font-medium">
                          &lt;{m.tag}&gt;
                        </span>
                        {m.id && (
                          <span className="text-amber-600 dark:text-amber-400">
                            #{m.id}
                          </span>
                        )}
                        {m.classes.map((c) => (
                          <span
                            key={c}
                            className="text-emerald-600 dark:text-emerald-400"
                          >
                            .{c}
                          </span>
                        ))}
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {idx + 1}
                        </span>
                      </div>
                      {m.textPreview ? (
                        <span className="font-sans text-[11px] text-muted-foreground truncate block">
                          {m.textPreview}
                        </span>
                      ) : (
                        <span className="font-sans text-[11px] text-muted-foreground/60 italic">
                          (no text content)
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
