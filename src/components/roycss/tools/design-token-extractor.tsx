"use client";

/**
 * DesignTokenExtractor — paste any CSS, get a structured design-token report
 * with visual previews, plus a copy-ready `:root { --token: value; }` block.
 *
 * Workflow:
 *   1. Paste CSS into the textarea.
 *   2. Click "Extract Tokens" — every declaration is parsed and grouped into
 *      six buckets: Colors, Spacing, Typography, Border radius, Shadows,
 *      Transitions & Animations.
 *   3. Each token row shows the raw value, how many times it appears, the
 *      source properties that introduced it, and a visual preview that
 *      matches its category (color swatch, spacing bar, typography sample,
 *      rounded box, shadow box, transition label).
 *   4. "Generate CSS Variables" stitches the unique values into a
 *      `:root { --<bucket>-<n>: <value>; ... }` block and shows it beside a
 *      Copy button.
 *
 * Parser notes:
 *   - Comments and at-rule preambles are stripped first; then a single
 *     regex sweep pulls every `property: value;` pair. This is intentionally
 *     loose — it doesn't care about selector context, so it also picks up
 *     tokens inside `@media` / `@keyframes` blocks, which is usually what
 *     you want for a token audit.
 *   - Color values are matched across the whole CSS string (so multi-value
 *     `background: linear-gradient(...)` and `box-shadow: 0 0 0 #fff` both
 *     surface their colors). Spacing / typography / radius / shadow /
 *     transition tokens are taken only from declarations whose property
 *     name belongs to the relevant family.
 *
 * Implementation notes:
 *   - All parsing is local — no network, no eval, no DOM walking.
 *   - Clipboard writes are best-effort. Copy timer tracked via `useRef` and
 *     cleared on unmount.
 *   - TS strict, no `any`, no `console.log`. Self-contained, no props.
 *   - Responsive within `max-w-6xl`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Wand2,
  Copy,
  Check,
  Palette,
  Ruler,
  Type,
  CornerDownRight,
  Square,
  Zap,
  Code2,
  RotateCcw,
  Hash,
  Brackets,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const DEFAULT_CSS = `:root {
  --brand: #0ea5e9;
  --brand-strong: oklch(0.55 0.2 240);
  --text: #18181b;
  --text-muted: #71717a;
}

.card {
  background: #ffffff;
  color: var(--text);
  padding: 16px 24px;
  margin: 0 0 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-family: "Inter", system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}`;

// ── Regexes ──────────────────────────────────────────────────────

/** Match any CSS color expression (hex, rgb, hsl, oklch, oklab, color-mix, color()). */
const COLOR_RE =
  /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|color-mix\([^)]*\)|color\([^)]*\)/g;

/** Match a single length value (number + unit). */
const LENGTH_RE = /-?\d+(?:\.\d+)?(?:px|rem|em|ex|ch|vw|vh|vmin|vmax|%|fr)\b/g;

/** Match a top-level `property: value;` declaration. */
const DECL_RE = /([a-zA-Z-]+)\s*:\s*([^;{}]+?)\s*(?=;|}|$)/g;

const SPACING_PROPS = new Set([
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "margin-inline",
  "margin-block",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "padding-inline",
  "padding-block",
  "gap",
  "row-gap",
  "column-gap",
  "inset",
  "inset-inline",
  "inset-block",
  "top",
  "right",
  "bottom",
  "left",
  "translate",
]);

const TYPO_PROPS = new Set([
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "font-style",
]);

const RADIUS_PROPS = new Set([
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "border-start-start-radius",
  "border-start-end-radius",
  "border-end-start-radius",
  "border-end-end-radius",
]);

const SHADOW_PROPS = new Set(["box-shadow", "text-shadow"]);

const TRANSITION_PROPS = new Set([
  "transition",
  "transition-property",
  "transition-duration",
  "transition-timing-function",
  "transition-delay",
  "animation",
  "animation-name",
  "animation-duration",
  "animation-timing-function",
  "animation-delay",
  "animation-iteration-count",
  "animation-direction",
  "animation-fill-mode",
  "animation-play-state",
  "animation-timeline",
]);

// ============================================================
// Types
// ============================================================

interface ExtractedToken {
  value: string;
  count: number;
  /** Property names that introduced this token value. */
  properties: string[];
}

interface TokenReport {
  colors: ExtractedToken[];
  spacing: ExtractedToken[];
  typography: ExtractedToken[];
  borderRadius: ExtractedToken[];
  shadows: ExtractedToken[];
  transitions: ExtractedToken[];
}

type TokenBucket = keyof TokenReport;

interface BucketMeta {
  key: TokenBucket;
  label: string;
  icon: typeof Palette;
  accent: string;
}

const BUCKETS: BucketMeta[] = [
  { key: "colors", label: "Colors", icon: Palette, accent: "text-rose-600" },
  { key: "spacing", label: "Spacing", icon: Ruler, accent: "text-emerald-600" },
  { key: "typography", label: "Typography", icon: Type, accent: "text-amber-600" },
  { key: "borderRadius", label: "Border radius", icon: CornerDownRight, accent: "text-violet-600" },
  { key: "shadows", label: "Shadows", icon: Square, accent: "text-teal-600" },
  { key: "transitions", label: "Transitions & Animations", icon: Zap, accent: "text-orange-600" },
];

// ============================================================
// Parser
// ============================================================

interface Declared {
  property: string;
  value: string;
}

function parseDeclarations(css: string): Declared[] {
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Declared[] = [];
  DECL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DECL_RE.exec(cleaned)) !== null) {
    const property = m[1].trim().toLowerCase();
    const value = m[2].trim();
    if (!property || !value) continue;
    out.push({ property, value });
  }
  return out;
}

function bumpToken(
  bucket: Map<string, ExtractedToken>,
  value: string,
  property: string,
): void {
  const existing = bucket.get(value);
  if (existing) {
    existing.count += 1;
    if (!existing.properties.includes(property)) {
      existing.properties.push(property);
    }
  } else {
    bucket.set(value, { value, count: 1, properties: [property] });
  }
}

function extractTokens(css: string): TokenReport {
  const colors = new Map<string, ExtractedToken>();
  const spacing = new Map<string, ExtractedToken>();
  const typography = new Map<string, ExtractedToken>();
  const borderRadius = new Map<string, ExtractedToken>();
  const shadows = new Map<string, ExtractedToken>();
  const transitions = new Map<string, ExtractedToken>();

  // Whole-CSS color sweep (so multi-value props also surface colors).
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  COLOR_RE.lastIndex = 0;
  let cm: RegExpExecArray | null;
  while ((cm = COLOR_RE.exec(cleaned)) !== null) {
    bumpToken(colors, cm[0], "(any)");
  }

  // Per-declaration sweep for the other buckets.
  for (const { property, value } of parseDeclarations(css)) {
    if (SPACING_PROPS.has(property)) {
      LENGTH_RE.lastIndex = 0;
      let lm: RegExpExecArray | null;
      while ((lm = LENGTH_RE.exec(value)) !== null) {
        // Skip bare `0` (zero can't carry a unit and is everywhere).
        if (lm[0] !== "0") {
          bumpToken(spacing, lm[0], property);
        }
      }
    } else if (TYPO_PROPS.has(property)) {
      // For font-family etc., keep the whole value as one token.
      bumpToken(typography, value, property);
    } else if (RADIUS_PROPS.has(property)) {
      bumpToken(borderRadius, value, property);
    } else if (SHADOW_PROPS.has(property)) {
      bumpToken(shadows, value, property);
    } else if (TRANSITION_PROPS.has(property)) {
      bumpToken(transitions, value, property);
    }
  }

  const toSorted = (m: Map<string, ExtractedToken>): ExtractedToken[] =>
    Array.from(m.values()).sort((a, b) => b.count - a.count);

  return {
    colors: toSorted(colors),
    spacing: toSorted(spacing),
    typography: toSorted(typography),
    borderRadius: toSorted(borderRadius),
    shadows: toSorted(shadows),
    transitions: toSorted(transitions),
  };
}

// ============================================================
// CSS variable generation
// ============================================================

function sanitizeVarName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "tok";
}

function generateCssVars(report: TokenReport): string {
  const lines: string[] = [":root {"];

  const emit = (bucket: TokenBucket, tokens: ExtractedToken[]): void => {
    if (tokens.length === 0) return;
    lines.push(`  /* ${bucket} */`);
    tokens.forEach((t, i) => {
      const name = `--${sanitizeVarName(t.value)}${
        i > 0 ? `-${i + 1}` : ""
      }`;
      lines.push(`  ${name}: ${t.value};`);
    });
  };

  emit("colors", report.colors);
  emit("spacing", report.spacing);
  emit("typography", report.typography);
  emit("borderRadius", report.borderRadius);
  emit("shadows", report.shadows);
  emit("transitions", report.transitions);

  lines.push("}");
  return lines.join("\n");
}

// ============================================================
// Visual previews (per bucket)
// ============================================================

function ColorSwatch({ value }: { value: string }): ReactNode {
  return (
    <span
      className="inline-block size-5 shrink-0 rounded border border-zinc-200 dark:border-zinc-700"
      style={{ background: value }}
      aria-label={value}
    />
  );
}

function SpacingBar({ value }: { value: string }): ReactNode {
  // Parse to px (rough: rem→16px, em→16px, others→0).
  const px = (() => {
    const m = value.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/);
    if (!m) return null;
    const n = parseFloat(m[1]);
    const u = m[2] ?? "px";
    if (u === "px") return n;
    if (u === "rem" || u === "em") return n * 16;
    if (u === "%") return n; // already 0..100 — clamp below
    return null;
  })();
  const width = px == null ? 32 : Math.max(4, Math.min(120, Math.abs(px)));
  return (
    <span
      className="inline-block h-2 shrink-0 rounded-sm bg-emerald-500"
      style={{ width }}
      aria-label={`${value} (${px ?? "?"}px)`}
    />
  );
}

function TypographySample({ value, property }: { value: string; property: string }): ReactNode {
  const style: CSSProperties = {};
  if (property === "font-family") style.fontFamily = value;
  else if (property === "font-size") style.fontSize = value;
  else if (property === "font-weight") style.fontWeight = value;
  else if (property === "line-height") style.lineHeight = value;
  else if (property === "letter-spacing") style.letterSpacing = value;
  else if (property === "font-style") style.fontStyle = value;
  return (
    <span
      className="truncate text-sm text-zinc-800 dark:text-zinc-200"
      style={style}
    >
      The quick brown fox
    </span>
  );
}

function RadiusBox({ value }: { value: string }): ReactNode {
  return (
    <span
      className="inline-block size-5 shrink-0 border-2 border-violet-400 bg-violet-100 dark:bg-violet-950/40"
      style={{ borderRadius: value }}
      aria-label={`radius ${value}`}
    />
  );
}

function ShadowBox({ value }: { value: string }): ReactNode {
  return (
    <span
      className="inline-block size-5 shrink-0 rounded bg-white dark:bg-zinc-100"
      style={{ boxShadow: value }}
      aria-label={`shadow ${value}`}
    />
  );
}

// ============================================================
// Token row
// ============================================================

function TokenRow({
  token,
  bucket,
}: {
  token: ExtractedToken;
  bucket: TokenBucket;
}): ReactNode {
  const renderPreview = (): ReactNode => {
    switch (bucket) {
      case "colors":
        return <ColorSwatch value={token.value} />;
      case "spacing":
        return <SpacingBar value={token.value} />;
      case "typography":
        return (
          <TypographySample
            value={token.value}
            property={token.properties[0] ?? ""}
          />
        );
      case "borderRadius":
        return <RadiusBox value={token.value} />;
      case "shadows":
        return <ShadowBox value={token.value} />;
      case "transitions":
        return <Zap className="size-4 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <li className="flex items-center gap-3 border-b border-zinc-100 px-3 py-2 last:border-0 dark:border-zinc-900">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {renderPreview()}
      </div>
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-800 dark:text-zinc-200">
        {token.value}
      </code>
      <span className="shrink-0 text-[10px] text-muted-foreground">
        {token.properties.join(", ")}
      </span>
      <Badge variant="outline" className="shrink-0 text-[10px] tabular-nums">
        ×{token.count}
      </Badge>
    </li>
  );
}

// ============================================================
// Component
// ============================================================

export function DesignTokenExtractor() {
  const [css, setCss] = useState<string>(DEFAULT_CSS);
  const [report, setReport] = useState<TokenReport | null>(null);
  const [vars, setVars] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleExtract = useCallback(() => {
    const r = extractTokens(css);
    setReport(r);
    setVars(generateCssVars(r));
    setCopied(false);
  }, [css]);

  const handleReset = useCallback(() => {
    setReport(null);
    setVars("");
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!vars) return;
    try {
      await navigator.clipboard.writeText(vars);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [vars]);

  const totalTokens = useMemo(() => {
    if (!report) return 0;
    return (
      report.colors.length +
      report.spacing.length +
      report.typography.length +
      report.borderRadius.length +
      report.shadows.length +
      report.transitions.length
    );
  }, [report]);

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brackets className="size-5 text-rose-600" />
          Design Token Extractor
        </CardTitle>
        <CardDescription>
          Paste any CSS and pull out colors, spacing, typography, radii,
          shadows and transitions — each with a visual preview and a
          copy-ready <code className="mx-1">:root {`{ --token: value; }`}</code>
          block.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Input */}
        <div className="grid gap-2">
          <Label htmlFor="css-input" className="flex items-center gap-2 text-xs">
            <Code2 className="size-3.5 text-zinc-500" />
            Your CSS
          </Label>
          <Textarea
            id="css-input"
            value={css}
            onChange={(e) => setCss(e.target.value)}
            spellCheck={false}
            className="min-h-40 resize-y font-mono text-xs leading-relaxed"
            placeholder=".class { color: #fff; padding: 1rem; ... }"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleExtract}
            className="gap-1.5 bg-rose-600 text-white hover:bg-rose-700"
          >
            <Wand2 className="size-4" />
            Extract Tokens
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!report}
            className="gap-1.5"
          >
            <RotateCcw className="size-4" />
            Clear
          </Button>
          {report && (
            <Badge variant="outline" className="gap-1">
              <Hash className="size-3" />
              {totalTokens} unique tokens
            </Badge>
          )}
        </div>

        {/* Results */}
        {report && (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            {/* Buckets grid */}
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(220px, 1fr))",
              } as CSSProperties}
            >
              {BUCKETS.map((b) => {
                const tokens = report[b.key];
                const Icon = b.icon;
                return (
                  <div
                    key={b.key}
                    className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Icon className={cn("size-3.5", b.accent)} />
                        {b.label}
                      </div>
                      <Badge variant="secondary" className="text-[10px] tabular-nums">
                        {tokens.length}
                      </Badge>
                    </div>
                    {tokens.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                        None found.
                      </div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto">
                        {tokens.map((t) => (
                          <TokenRow key={t.value} token={t} bucket={b.key} />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CSS variables output */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs">
                  <Sparkles className="size-3.5 text-rose-600" />
                  Generated CSS Variables
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!vars}
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
              <pre className="max-h-[28rem] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
                {vars || "—"}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DesignTokenExtractor;
