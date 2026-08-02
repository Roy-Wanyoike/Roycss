"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  SquareStack,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  MoveHorizontal,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * ContainerQueryBuilder — interactive builder for CSS `@container` queries.
 *
 * Generates `container-type` / `container-name` setup CSS plus one or more
 * `@container (min-width: Npx) { ... }` breakpoint rules, with a LIVE,
 * user-resizable container preview that demonstrates how container queries
 * respond to the *container's* width (not the viewport's).
 *
 * The preview uses REAL container queries — the generated CSS is injected
 * into a `<style>` tag (via ref + useEffect) and applies to a `.cqb-container`
 * element that the user can drag to resize. A `ResizeObserver` tracks the
 * container's actual rendered width (rAF-throttled) so the width badge and
 * "active query" indicator stay in sync even when parent constraints clamp
 * the rendered width below the requested target.
 *
 * Browser support: Chrome 105+, Firefox 110+, Safari 16+, Edge 105+
 * (Baseline 2023).
 */

// ─── Types ──────────────────────────────────────────────────────────────────

type ContainerType = "inline-size" | "size" | "normal";
type Operator = "min-width" | "max-width" | "range";

interface BreakpointRule {
  id: string;
  operator: Operator;
  /** px value for min-width, or lower bound for range. */
  minValue: number;
  /** px value for max-width, or upper bound for range. */
  maxValue: number;
  /** Human label, e.g. "card horizontal". Used as a comment in the CSS. */
  label: string;
  /** Raw CSS declarations, e.g. "flex-direction: row; font-size: 16px;". */
  declarations: string;
}

interface ContainerConfig {
  type: ContainerType;
  name: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MIN_CONTAINER_WIDTH = 200;
const MAX_CONTAINER_WIDTH = 800;
const DEFAULT_CONTAINER_WIDTH = 480;
const COPY_CONFIRM_MS = 2000;
const MAX_RULES = 6;
const MIN_RULES = 1;
const KEYBOARD_STEP = 10;
const KEYBOARD_STEP_LARGE = 50;
const SLIDER_STEP = 5;

const CONTAINER_TYPES: {
  value: ContainerType;
  label: string;
  hint: string;
}[] = [
  {
    value: "inline-size",
    label: "inline-size",
    hint: "Responds to the container's inline (width) size. Most common.",
  },
  {
    value: "size",
    label: "size",
    hint: "Responds to both inline and block (width + height).",
  },
  {
    value: "normal",
    label: "normal",
    hint: "Disables the container query context for this element.",
  },
];

const OPERATORS: { value: Operator; label: string }[] = [
  { value: "min-width", label: "min-width ≥" },
  { value: "max-width", label: "max-width ≤" },
  { value: "range", label: "range" },
];

const DEFAULT_RULES: BreakpointRule[] = [
  {
    id: "rule-1",
    operator: "min-width",
    minValue: 400,
    maxValue: 600,
    label: "card horizontal",
    declarations: "flex-direction: row; font-size: 16px;",
  },
  {
    id: "rule-2",
    operator: "min-width",
    minValue: 600,
    maxValue: 800,
    label: "card featured",
    declarations: "font-size: 18px; padding: 24px;",
  },
];

const DEFAULT_CONFIG: ContainerConfig = {
  type: "inline-size",
  name: "",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function clampNum(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Sanitize a user-supplied container name. CSS `custom-ident` syntax allows
 * [A-Za-z0-9_-] and must not start with a digit (or two hyphens). We collapse
 * everything else to hyphens, strip leading/trailing hyphens, and prefix
 * leading digits with `c-`. Returns "" for empty / all-invalid input, which
 * the caller treats as "no container-name".
 */
function sanitizeContainerName(raw: string): string {
  const cleaned = raw
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
  if (cleaned.length === 0) return "";
  if (/^[0-9]/.test(cleaned)) return `c-${cleaned}`;
  // Avoid reserved CSS-wide keywords that would make the rule invalid.
  if (["initial", "inherit", "none", "unset", "revert"].includes(cleaned)) {
    return `c-${cleaned}`;
  }
  return cleaned;
}

/** Build the `@container` condition string for a rule, e.g. `(min-width: 400px)`. */
function ruleCondition(rule: BreakpointRule): string {
  if (rule.operator === "min-width") return `(min-width: ${rule.minValue}px)`;
  if (rule.operator === "max-width") return `(max-width: ${rule.maxValue}px)`;
  return `(min-width: ${rule.minValue}px) and (max-width: ${rule.maxValue}px)`;
}

/** Whether a rule matches a given container width (px). */
function ruleMatches(rule: BreakpointRule, width: number): boolean {
  if (rule.operator === "min-width") return width >= rule.minValue;
  if (rule.operator === "max-width") return width <= rule.maxValue;
  return width >= rule.minValue && width <= rule.maxValue;
}

/**
 * Parse the raw declarations string into indented CSS lines.
 * Splits on `;`, trims, drops empty tokens, re-appends `;`.
 */
function formatDeclarations(raw: string, indent: string): string {
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((d) => `${indent}${d};`)
    .join("\n");
}

/** Build the full generated CSS string shown to the user and injected live. */
function buildCSS(config: ContainerConfig, rules: BreakpointRule[]): string {
  const safeName = sanitizeContainerName(config.name);
  const lines: string[] = [];

  // ── Container setup ───────────────────────────────────────────────
  lines.push("/* 1. Container setup — apply to the wrapper element */");
  lines.push(".cqb-container {");
  lines.push(`  container-type: ${config.type};`);
  if (safeName) {
    lines.push(`  container-name: ${safeName};`);
  }
  lines.push("}");
  lines.push("");

  // ── Base card style ───────────────────────────────────────────────
  lines.push("/* 2. Base card style (default — no query matches yet) */");
  lines.push(".cqb-card {");
  lines.push("  display: flex;");
  lines.push("  flex-direction: column;");
  lines.push("  gap: 8px;");
  lines.push("  padding: 16px;");
  lines.push("  background: var(--card);");
  lines.push("  border: 1px solid var(--border);");
  lines.push("  border-radius: 8px;");
  lines.push("}");
  lines.push("");

  // ── Container query rules ─────────────────────────────────────────
  const prefix = safeName ? `@container ${safeName}` : "@container";
  rules.forEach((rule, idx) => {
    const label = rule.label.trim() || `rule ${idx + 1}`;
    lines.push(`/* 3.${idx + 1} @container: ${label} */`);
    lines.push(`${prefix} ${ruleCondition(rule)} {`);
    lines.push("  .cqb-card {");
    const decls = formatDeclarations(rule.declarations, "    ");
    if (decls) {
      lines.push(decls);
    } else {
      lines.push("    /* add declarations like: font-size: 18px; */");
    }
    lines.push("  }");
    lines.push("}");
    if (idx < rules.length - 1) lines.push("");
  });

  return lines.join("\n");
}

/** Collect all unique breakpoint px values across rules (for the ruler ticks). */
function collectBreakpointValues(rules: BreakpointRule[]): number[] {
  const set = new Set<number>();
  rules.forEach((r) => {
    if (r.operator === "max-width") {
      set.add(r.maxValue);
    } else if (r.operator === "min-width") {
      set.add(r.minValue);
    } else {
      set.add(r.minValue);
      set.add(r.maxValue);
    }
  });
  return Array.from(set).sort((a, b) => a - b);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ContainerQueryBuilder() {
  const [config, setConfig] = useState<ContainerConfig>(DEFAULT_CONFIG);
  const [rules, setRules] = useState<BreakpointRule[]>(DEFAULT_RULES);
  const [containerWidth, setContainerWidth] = useState<number>(
    DEFAULT_CONTAINER_WIDTH,
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Refs
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const idCounter = useRef<number>(DEFAULT_RULES.length);

  // ── Generated CSS (memoized) ──────────────────────────────────────
  const generatedCSS = useMemo(
    () => buildCSS(config, rules),
    [config, rules],
  );

  // ── Inject the generated CSS into the live <style> tag ────────────
  useEffect(() => {
    if (styleRef.current) {
      styleRef.current.textContent = generatedCSS;
    }
  }, [generatedCSS]);

  // ── ResizeObserver: track the container's actual rendered width ───
  // rAF-throttled to avoid excessive renders. Only updates state when the
  // rendered width differs from state by >= 1px (handles parent-constraint
  // clamping and prevents feedback loops).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver((entries) => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        for (const entry of entries) {
          const w = Math.round(entry.contentRect.width);
          setContainerWidth((prev) =>
            Math.abs(prev - w) >= 1 ? clampNum(w, MIN_CONTAINER_WIDTH, MAX_CONTAINER_WIDTH) : prev,
          );
        }
      });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // ── Active query detection (memoized) ─────────────────────────────
  // CSS cascade: the LAST matching rule wins for conflicting properties.
  const matchingRules = useMemo(
    () => rules.filter((r) => ruleMatches(r, containerWidth)),
    [rules, containerWidth],
  );
  const activeRule =
    matchingRules.length > 0
      ? matchingRules[matchingRules.length - 1]
      : null;

  const breakpointValues = useMemo(
    () => collectBreakpointValues(rules),
    [rules],
  );

  // ── Drag handle pointer events (custom resize handle) ─────────────
  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      try {
        (e.currentTarget as HTMLDivElement).setPointerCapture(
          e.pointerId,
        );
      } catch {
        /* pointer capture unavailable — fall back to window listeners */
      }
    },
    [],
  );

  const onHandlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newWidth = Math.round(e.clientX - rect.left);
      setContainerWidth(
        clampNum(newWidth, MIN_CONTAINER_WIDTH, MAX_CONTAINER_WIDTH),
      );
    },
    [isDragging],
  );

  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(
          e.pointerId,
        );
      } catch {
        /* already released */
      }
    },
    [],
  );

  // ── Keyboard support on the drag handle (role="slider") ───────────
  const onHandleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const shift = e.shiftKey;
      let delta = 0;
      switch (e.key) {
        case "ArrowLeft":
          delta = shift ? -KEYBOARD_STEP_LARGE : -KEYBOARD_STEP;
          break;
        case "ArrowRight":
          delta = shift ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;
          break;
        case "PageDown":
          delta = -KEYBOARD_STEP_LARGE;
          break;
        case "PageUp":
          delta = KEYBOARD_STEP_LARGE;
          break;
        case "Home":
          e.preventDefault();
          setContainerWidth(MIN_CONTAINER_WIDTH);
          return;
        case "End":
          e.preventDefault();
          setContainerWidth(MAX_CONTAINER_WIDTH);
          return;
        default:
          return;
      }
      e.preventDefault();
      setContainerWidth((prev) =>
        clampNum(prev + delta, MIN_CONTAINER_WIDTH, MAX_CONTAINER_WIDTH),
      );
    },
    [],
  );

  // ── Handlers: copy / reset / rule CRUD ────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCSS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [generatedCSS]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setRules(DEFAULT_RULES);
    setContainerWidth(DEFAULT_CONTAINER_WIDTH);
    idCounter.current = DEFAULT_RULES.length;
  }, []);

  const updateConfig = useCallback(
    <K extends keyof ContainerConfig>(key: K, value: ContainerConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const addRule = useCallback(() => {
    setRules((prev) => {
      if (prev.length >= MAX_RULES) return prev;
      const newRule: BreakpointRule = {
        id: `rule-${++idCounter.current}`,
        operator: "min-width",
        minValue: 500,
        maxValue: 700,
        label: "",
        declarations: "",
      };
      return [...prev, newRule];
    });
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.length <= MIN_RULES ? prev : prev.filter((r) => r.id !== id),
    );
  }, []);

  const updateRule = useCallback(
    (id: string, patch: Partial<BreakpointRule>) => {
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Hidden <style> tag — receives the real generated CSS via ref */}
      <style ref={styleRef} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <SquareStack className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold leading-tight">
              Container Query Builder
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Build{" "}
              <code className="font-mono text-foreground/70">
                @container
              </code>{" "}
              queries with a live, resizable container preview.
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

      {/* ── Browser support badge ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
          <Sparkles className="size-3.5" />
          Container queries
        </span>
        <span className="text-[11px] text-muted-foreground">
          Chrome 105+ · Firefox 110+ · Safari 16+ · Edge 105+ (Baseline 2023)
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          See: Browser Support Matrix
        </span>
      </div>

      {/* ── Container setup ─────────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Container setup
        </span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="cqb-container-type"
              className="text-xs text-muted-foreground"
            >
              container-type
            </Label>
            <Select
              value={config.type}
              onValueChange={(v) =>
                updateConfig("type", v as ContainerType)
              }
            >
              <SelectTrigger
                id="cqb-container-type"
                className="h-8 w-full font-mono text-xs"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTAINER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="font-mono">{t.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] leading-snug text-muted-foreground">
              {CONTAINER_TYPES.find((t) => t.value === config.type)?.hint}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="cqb-container-name"
              className="text-xs text-muted-foreground"
            >
              container-name{" "}
              <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="cqb-container-name"
              type="text"
              value={config.name}
              onChange={(e) => updateConfig("name", e.target.value)}
              placeholder="e.g. sidebar (or leave empty)"
              className="h-8 font-mono text-xs"
              spellCheck={false}
              autoComplete="off"
            />
            <p className="text-[10px] leading-snug text-muted-foreground">
              {sanitizeContainerName(config.name) ? (
                <>
                  Queries become{" "}
                  <code className="font-mono text-foreground/70">
                    @container {sanitizeContainerName(config.name)} (…)
                  </code>
                  .
                </>
              ) : (
                <>Unnamed — queries target the nearest ancestor container.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Rules list ──────────────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Breakpoints ({rules.length}/{MAX_RULES})
          </span>
          <button
            type="button"
            onClick={addRule}
            disabled={rules.length >= MAX_RULES}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            Add rule
          </button>
        </div>

        <div className="space-y-2">
          {rules.map((rule, idx) => {
            const matches = ruleMatches(rule, containerWidth);
            const isWinner = activeRule?.id === rule.id;
            const rangeInvalid =
              rule.operator === "range" && rule.minValue > rule.maxValue;
            return (
              <div
                key={rule.id}
                className={cn(
                  "rounded-lg border bg-card p-3 transition-colors",
                  isWinner
                    ? "border-emerald-500/50"
                    : matches
                      ? "border-primary/40"
                      : "border-border",
                )}
              >
                {/* Row 1: label + operator + values + delete */}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[120px] flex-1 space-y-1">
                    <Label
                      htmlFor={`cqb-label-${rule.id}`}
                      className="text-[10px] text-muted-foreground"
                    >
                      Label
                    </Label>
                    <Input
                      id={`cqb-label-${rule.id}`}
                      type="text"
                      value={rule.label}
                      onChange={(e) =>
                        updateRule(rule.id, { label: e.target.value })
                      }
                      placeholder={`rule ${idx + 1}`}
                      className="h-8 text-xs"
                      spellCheck={false}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor={`cqb-op-${rule.id}`}
                      className="text-[10px] text-muted-foreground"
                    >
                      Condition
                    </Label>
                    <Select
                      value={rule.operator}
                      onValueChange={(v) =>
                        updateRule(rule.id, { operator: v as Operator })
                      }
                    >
                      <SelectTrigger
                        id={`cqb-op-${rule.id}`}
                        className="h-8 w-[130px] text-xs"
                        size="sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {rule.operator !== "max-width" ? (
                    <div className="space-y-1">
                      <Label
                        htmlFor={`cqb-min-${rule.id}`}
                        className="text-[10px] text-muted-foreground"
                      >
                        {rule.operator === "range" ? "Min (px)" : "Value (px)"}
                      </Label>
                      <Input
                        id={`cqb-min-${rule.id}`}
                        type="number"
                        min={0}
                        step={10}
                        value={rule.minValue}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isNaN(n)) {
                            updateRule(rule.id, { minValue: n });
                          }
                        }}
                        className="h-8 w-20 text-right font-mono text-xs"
                        aria-invalid={rangeInvalid || undefined}
                      />
                    </div>
                  ) : null}

                  {rule.operator !== "min-width" ? (
                    <div className="space-y-1">
                      <Label
                        htmlFor={`cqb-max-${rule.id}`}
                        className="text-[10px] text-muted-foreground"
                      >
                        {rule.operator === "range" ? "Max (px)" : "Value (px)"}
                      </Label>
                      <Input
                        id={`cqb-max-${rule.id}`}
                        type="number"
                        min={0}
                        step={10}
                        value={rule.maxValue}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isNaN(n)) {
                            updateRule(rule.id, { maxValue: n });
                          }
                        }}
                        className="h-8 w-20 text-right font-mono text-xs"
                        aria-invalid={rangeInvalid || undefined}
                      />
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    disabled={rules.length <= MIN_RULES}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Remove rule ${rule.label || idx + 1}`}
                    title="Remove rule"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Row 2: declarations textarea */}
                <div className="mt-2 space-y-1">
                  <Label
                    htmlFor={`cqb-decls-${rule.id}`}
                    className="text-[10px] text-muted-foreground"
                  >
                    CSS declarations (applied to{" "}
                    <code className="font-mono">.cqb-card</code> when query
                    matches)
                  </Label>
                  <Textarea
                    id={`cqb-decls-${rule.id}`}
                    value={rule.declarations}
                    onChange={(e) =>
                      updateRule(rule.id, { declarations: e.target.value })
                    }
                    placeholder="flex-direction: row; font-size: 16px;"
                    className="min-h-[44px] font-mono text-xs leading-relaxed"
                    spellCheck={false}
                  />
                </div>

                {/* Row 3: generated @container line + match status */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground/80">
                    {sanitizeContainerName(config.name)
                      ? `@container ${sanitizeContainerName(config.name)}`
                      : "@container"}{" "}
                    {ruleCondition(rule)}
                  </code>
                  {rangeInvalid ? (
                    <span className="text-[10px] font-medium text-destructive">
                      min &gt; max — rule never matches
                    </span>
                  ) : isWinner ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      active (cascade winner)
                    </span>
                  ) : matches ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
                      <span className="size-1.5 rounded-full bg-primary" />
                      matching
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                      not matching
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Generated CSS ───────────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
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
            aria-label={copied ? "CSS copied to clipboard" : "Copy CSS to clipboard"}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="max-h-48 overflow-x-auto overflow-y-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-foreground/80">
          <code>{generatedCSS}</code>
        </pre>
        <p className="text-[10px] text-muted-foreground">
          Apply{" "}
          <code className="font-mono text-foreground/70">.cqb-container</code>{" "}
          to a wrapper and{" "}
          <code className="font-mono text-foreground/70">.cqb-card</code>{" "}
          to its child — rename the classes to fit your project.
        </p>
      </div>

      {/* ── Live preview (the star feature) ─────────────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live preview
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground/80">
              <Maximize2 className="size-3 text-muted-foreground" />
              Container width: {containerWidth}px
            </span>
            {activeRule ? (
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Active:</span>
                <code className="font-mono text-foreground/80">
                  {sanitizeContainerName(config.name)
                    ? `@container ${sanitizeContainerName(config.name)}`
                    : "@container"}{" "}
                  {ruleCondition(activeRule)}
                </code>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="size-2 rounded-full bg-muted-foreground/40" />
                No query matches
              </span>
            )}
          </div>
        </div>

        {/* Resizable container + custom drag handle */}
        <div className="rounded-lg bg-muted/30 p-4">
          <div className="flex w-full items-stretch">
            {/* The actual container — receives container-type via injected CSS */}
            <div
              ref={containerRef}
              className="cqb-container relative overflow-hidden rounded-l-lg border border-r-0 border-border bg-background"
              style={{
                width: containerWidth,
                maxWidth: "100%",
                minWidth: MIN_CONTAINER_WIDTH,
              }}
            >
              {/* Demo card — .cqb-card base style + queries apply via CSS */}
              <div className="cqb-card">
                <div
                  className="cqb-avatar shrink-0 rounded-lg bg-primary"
                  style={{ width: 40, height: 40 }}
                  aria-hidden="true"
                />
                <div className="cqb-text min-w-0">
                  <div className="cqb-heading font-semibold leading-tight">
                    Container card
                  </div>
                  <div className="cqb-body mt-1 leading-snug text-muted-foreground">
                    This card responds to its{" "}
                    <em>container&rsquo;s</em> width, not the viewport&rsquo;s.
                    Drag the handle to resize.
                  </div>
                </div>
              </div>
            </div>

            {/* Custom drag handle — role="slider", keyboard accessible */}
            <div
              role="slider"
              aria-label="Container width"
              aria-valuenow={containerWidth}
              aria-valuemin={MIN_CONTAINER_WIDTH}
              aria-valuemax={MAX_CONTAINER_WIDTH}
              aria-valuetext={`${containerWidth} pixels`}
              tabIndex={0}
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
              onKeyDown={onHandleKeyDown}
              className={cn(
                "flex w-4 cursor-col-resize select-none items-center justify-center rounded-r-lg border border-border bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isDragging
                  ? "bg-primary/15"
                  : "hover:bg-muted/70",
              )}
              title="Drag to resize the container (or use ← → arrow keys)"
            >
              <MoveHorizontal
                className={cn(
                  "size-3.5 text-muted-foreground transition-colors",
                  isDragging && "text-primary",
                )}
              />
            </div>
          </div>

          {/* Width markers (ruler) — ticks at each breakpoint value */}
          <div className="relative mt-2 h-5">
            <div className="absolute inset-x-0 top-0 h-px bg-border" />
            {breakpointValues.map((v) => {
              if (
                v < MIN_CONTAINER_WIDTH ||
                v > MAX_CONTAINER_WIDTH
              ) {
                return null;
              }
              const pct =
                ((v - MIN_CONTAINER_WIDTH) /
                  (MAX_CONTAINER_WIDTH - MIN_CONTAINER_WIDTH)) *
                100;
              return (
                <div
                  key={v}
                  className="absolute top-0 flex flex-col items-center"
                  style={{
                    left: `${pct}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div
                    className={cn(
                      "w-px",
                      containerWidth >= v ? "h-2 bg-primary" : "h-2 bg-border",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-0.5 font-mono text-[9px]",
                      containerWidth >= v
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {v}
                  </span>
                </div>
              );
            })}
            {/* Current width pointer */}
            <div
              className="absolute -top-1 size-2 -translate-x-1/2 rotate-45 border-b border-r border-primary bg-primary"
              style={{
                left: `${((containerWidth - MIN_CONTAINER_WIDTH) / (MAX_CONTAINER_WIDTH - MIN_CONTAINER_WIDTH)) * 100}%`,
              }}
              aria-hidden="true"
            />
          </div>

          {/* Slider — alternative precise width control, synced with drag handle */}
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="cqb-width-slider"
                className="text-[10px] text-muted-foreground"
              >
                Precise width control
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {MIN_CONTAINER_WIDTH}px – {MAX_CONTAINER_WIDTH}px
              </span>
            </div>
            <Slider
              id="cqb-width-slider"
              value={[containerWidth]}
              min={MIN_CONTAINER_WIDTH}
              max={MAX_CONTAINER_WIDTH}
              step={SLIDER_STEP}
              onValueChange={(v) => setContainerWidth(v[0])}
              aria-label="Container width"
            />
          </div>
        </div>

        {/* Matching rules summary */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Matching:
          </span>
          {matchingRules.length === 0 ? (
            <span className="text-[11px] text-muted-foreground">
              no rules match at {containerWidth}px
            </span>
          ) : (
            matchingRules.map((rule) => {
              const isWinner = activeRule?.id === rule.id;
              return (
                <span
                  key={rule.id}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px]",
                    isWinner
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {isWinner && (
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                  )}
                  {ruleCondition(rule)}
                  {rule.label.trim() ? (
                    <span className="font-sans text-[9px] opacity-70">
                      · {rule.label.trim()}
                    </span>
                  ) : null}
                </span>
              );
            })
          )}
          <span className="ml-auto text-[10px] text-muted-foreground">
            Last match wins (CSS cascade)
          </span>
        </div>

        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <MoveHorizontal className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Drag the handle, use the slider, or focus the handle and press{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              ←
            </kbd>{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              →
            </kbd>{" "}
            (hold{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              Shift
            </kbd>{" "}
            for 50px steps). The card visibly changes layout and typography as
            the container crosses each breakpoint.
          </span>
        </p>
      </div>
    </div>
  );
}
