"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ScanSearch,
  Wand2,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Info,
  BookOpen,
  ChevronDown,
  FileCode,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  lintCss,
  applyFixes,
  RECOMMENDED_LAYER_ORDER,
  type LintFinding,
  type LintRuleId,
} from "@/lib/css-lint";
import { effects } from "@/lib/roycss-effects";

/**
 * CSSHealthLinter — in-browser surface for the RoyCSS lint engine
 * (PF-036 V1 slice, issue #128). The same engine powers the
 * `roycss lint [--fix]` CLI, so findings here match the terminal.
 *
 * Rules: no-important, oklch-colors, roycss-prefix,
 *        reduced-motion-guard, layer-order.
 *
 * Auto-fixes are conservative (a11y guard insertion + roycss- prefixing);
 * `!important` is never removed automatically (cascade risk).
 */

// ============================================================
// Constants
// ============================================================

const RULE_INFO: Record<LintRuleId, { label: string; what: string }> = {
  "no-important": {
    label: "no-important",
    what: "Flags !important outside an a11y prefers-reduced-motion guard. !important breaks user cascade control — prefer @layer ordering or higher specificity.",
  },
  "oklch-colors": {
    label: "oklch-colors",
    what: "Flags hex / rgb() / rgba() / hsl() color literals. RoyCSS v2 standardizes on oklch() for perceptual uniformity and gamut headroom.",
  },
  "roycss-prefix": {
    label: "roycss-prefix",
    what: "Detects known effect ids used without the roycss- namespace prefix in class attributes (v2 requires the prefix).",
  },
  "reduced-motion-guard": {
    label: "reduced-motion-guard",
    what: "Warns when a stylesheet has no @media (prefers-reduced-motion: reduce) guard — animations would run for motion-sensitive users.",
  },
  "layer-order": {
    label: "layer-order",
    what: `Validates @layer declaration order against the recommended RoyCSS skeleton: ${RECOMMENDED_LAYER_ORDER.join(" → ")}.`,
  },
};

const SAMPLE_CSS = `/* Paste your CSS here, or press "Load sample" */
.card {
  color: #ff5733;
  background: rgba(0, 128, 255, 0.5);
}
.card-title {
  font-weight: bold !important;
}
.glow-border {
  border-color: hsl(200, 90%, 55%);
}
`;

const SAMPLE_MARKUP = `<div class="card pulse-glow bounce-in">Hover me</div>
<a class="glow-border" href="#">Read the docs</a>`;

type TabId = "report" | "fixed" | "rules";

// ============================================================
// Severity styling
// ============================================================

const SEVERITY_META = {
  error: { icon: XCircle, cls: "text-red-500 dark:text-red-400", bg: "bg-red-500/10 border-red-500/30 border-l-4 border-l-red-500/70 dark:border-l-red-400/70", chip: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" },
  warning: { icon: AlertTriangle, cls: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/30 border-l-4 border-l-amber-500/70 dark:border-l-amber-400/70", chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  info: { icon: Info, cls: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10 border-sky-500/30 border-l-4 border-l-sky-500/70 dark:border-l-sky-400/70", chip: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30" },
} as const;

function severityRank(f: LintFinding): number {
  return f.severity === "error" ? 0 : f.severity === "warning" ? 1 : 2;
}

// ============================================================
// Component
// ============================================================

/** Effect ids shared with the CLI (`roycss lint`) so the roycss-prefix
 *  rule and fixes behave identically in the browser. Module-level constant
 *  — the catalog is static. */
const KNOWN_EFFECT_IDS = effects.map((e) => e.id);

export function CSSHealthLinter() {
  const [source, setSource] = useState("");
  const [analyzed, setAnalyzed] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("report");
  const [copied, setCopied] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const result = useMemo(
    () => (analyzed !== null ? lintCss(analyzed, { knownEffectIds: KNOWN_EFFECT_IDS }) : null),
    [analyzed],
  );

  const fixResult = useMemo(() => {
    if (!analyzed || !result) return null;
    const fixable = result.findings.some((f) => f.fixable);
    if (!fixable) return null;
    return applyFixes(analyzed, result.findings, { knownEffectIds: KNOWN_EFFECT_IDS });
  }, [analyzed, result]);

  const analyze = useCallback(() => {
    setAnalyzed(source);
    setTab("report");
    setCopied(false);
  }, [source]);

  const applyFixesToSource = useCallback(() => {
    if (!fixResult) return;
    setSource(fixResult.fixed);
    setAnalyzed(fixResult.fixed);
    setTab("report");
  }, [fixResult]);

  const copyFixed = useCallback(async () => {
    if (!fixResult) return;
    try {
      await navigator.clipboard.writeText(fixResult.fixed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — non-fatal */
    }
  }, [fixResult]);

  const sortedFindings = useMemo(
    () =>
      result
        ? [...result.findings].sort(
            (a, b) => severityRank(a) - severityRank(b) || a.line - b.line,
          )
        : [],
    [result],
  );

  const summary = result?.summary;
  const clean = summary && summary.errors === 0 && summary.warnings === 0 && summary.infos === 0;

  return (
    <div className="space-y-4">
      {/* ── Input ─────────────────────────────────────────── */}
      <section aria-label="CSS input">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={analyze} disabled={!source.trim()} className="gap-2">
            <ScanSearch className="size-4" aria-hidden="true" />
            Analyze
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSource(SAMPLE_CSS);
              setAnalyzed(null);
            }}
          >
            Load sample CSS
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSource(SAMPLE_MARKUP);
              setAnalyzed(null);
            }}
          >
            Load sample markup
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() => {
              setSource("");
              setAnalyzed(null);
              setCopied(false);
            }}
            disabled={!source && analyzed === null}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Clear
          </Button>
        </div>
        <Textarea
          aria-label="CSS or class-attribute markup to lint"
          placeholder={"Paste CSS or HTML/JSX with class attributes…\n\n.card { color: #ff5733; }\n.roycss-title { font-weight: bold !important; }"}
          className="mt-3 min-h-40 max-h-64 font-mono text-[13px] leading-relaxed resize-y scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-border scrollbar-track-transparent"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Runs entirely in your browser — nothing is uploaded. The identical engine
          powers <code className="rounded bg-muted px-1 py-0.5 text-[11px]">roycss lint [--fix]</code> in the CLI.
        </p>
      </section>

      {/* ── Results ───────────────────────────────────────── */}
      {result && summary && (
        <section aria-label="Lint results" aria-live="polite" className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard
              label="Errors"
              value={summary.errors}
              icon={XCircle}
              tone={summary.errors > 0 ? "error" : "neutral"}
            />
            <SummaryCard
              label="Warnings"
              value={summary.warnings}
              icon={AlertTriangle}
              tone={summary.warnings > 0 ? "warning" : "neutral"}
            />
            <SummaryCard
              label="Info"
              value={summary.infos}
              icon={Info}
              tone={summary.infos > 0 ? "info" : "neutral"}
            />
            <SummaryCard
              label="Fixable"
              value={result.findings.filter((f) => f.fixable).length}
              icon={Wand2}
              tone="neutral"
            />
          </div>

          {/* Clean state */}
          {clean && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <ShieldCheck className="size-5 shrink-0 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Clean — no cascade, color, or namespace issues found.
              </p>
            </div>
          )}

          {/* Tabs: report / fixed / rules */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-1" role="tablist" aria-label="Result views">
            {(
              [
                ["report", `Report (${result.findings.length})`],
                ...(fixResult ? ([["fixed", "Fixed CSS"]] as const) : []),
                ["rules", "Rules reference"],
              ] as Array<[TabId, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tab === id
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Report list */}
          {tab === "report" && (
            <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border p-3 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-border scrollbar-track-transparent" role="tabpanel" aria-label="Findings list">
              {sortedFindings.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No findings. Ship it.
                </p>
              ) : (
                sortedFindings.map((f, i) => {
                  const meta = SEVERITY_META[f.severity];
                  const Icon = meta.icon;
                  return (
                    <article
                      key={`${f.rule}-${f.line}-${f.column}-${i}`}
                      className={cn("flex gap-3 rounded-lg border p-3", meta.bg)}
                    >
                      <Icon className={cn("mt-0.5 size-4 shrink-0", meta.cls)} aria-hidden="true" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={cn("font-mono text-[11px]", meta.chip)}>
                            {f.rule}
                          </Badge>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {f.line > 0 ? `line ${f.line}:${f.column}` : "whole file"}
                          </span>
                          {f.fixable && (
                            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                              <Wand2 className="size-2.5" aria-hidden="true" />
                              fixable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-snug">{f.message}</p>
                        {f.snippet && (
                          <p className="truncate font-mono text-[11px] text-muted-foreground">
                            {f.snippet}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* Fixed CSS */}
          {tab === "fixed" && fixResult && (
            <div className="space-y-3" role="tabpanel" aria-label="Fixed CSS">
              <ul className="space-y-1 text-xs text-muted-foreground" aria-label="Applied fixes">
                {fixResult.appliedFixes.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="size-3 text-emerald-500" aria-hidden="true" />
                    <span className="font-mono">{f.rule}</span> — {f.message}
                  </li>
                ))}
              </ul>
              <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-[12px] leading-relaxed scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-border scrollbar-track-transparent" aria-label="Fixed CSS output">
                {fixResult.fixed}
              </pre>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={copyFixed}>
                  {copied ? <Check className="size-3.5 text-emerald-500" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                  {copied ? "Copied" : "Copy fixed CSS"}
                </Button>
                <Button size="sm" className="gap-2" onClick={applyFixesToSource}>
                  <Wand2 className="size-3.5" aria-hidden="true" />
                  Apply fixes to input
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Only safe transforms are auto-applied. <code className="rounded bg-muted px-1 py-0.5">!important</code> is never removed automatically — cascade changes need human review.
              </p>
            </div>
          )}

          {/* Rules reference */}
          {tab === "rules" && (
            <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border p-4 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-border scrollbar-track-transparent" role="tabpanel" aria-label="Rules reference">
              {(Object.keys(RULE_INFO) as LintRuleId[]).map((rule) => (
                <div key={rule} className="space-y-1">
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {RULE_INFO[rule].label}
                  </Badge>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {RULE_INFO[rule].what}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Rules footer (collapsed pre-analyze) ──────────── */}
      {!result && (
        <div className="rounded-lg border">
          <button
            onClick={() => setRulesOpen((v) => !v)}
            aria-expanded={rulesOpen}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
              What does the linter check?
            </span>
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", rulesOpen && "rotate-180")} aria-hidden="true" />
          </button>
          {rulesOpen && (
            <dl className="space-y-3 border-t px-4 py-3">
              {(Object.keys(RULE_INFO) as LintRuleId[]).map((rule) => (
                <div key={rule} className="space-y-1">
                  <dt className="font-mono text-[11px] font-medium">{RULE_INFO[rule].label}</dt>
                  <dd className="text-xs leading-relaxed text-muted-foreground">{RULE_INFO[rule].what}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {/* CLI hint */}
      <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        <FileCode className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>
          CI users: <code className="rounded bg-muted px-1 py-0.5">npx roycss lint src --fix</code> exits 1 on errors.
          The framework&apos;s own <code className="rounded bg-muted px-1 py-0.5">!important</code> budget is ratcheted by{" "}
          <code className="rounded bg-muted px-1 py-0.5">bun run audit:important:check</code>.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Summary card
// ============================================================

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof XCircle;
  tone: "error" | "warning" | "info" | "neutral";
}) {
  const toneCls =
    tone === "error"
      ? "border-red-500/30 bg-red-500/10"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10"
        : tone === "info"
          ? "border-sky-500/30 bg-sky-500/10"
          : "";
  const textCls =
    tone === "error"
      ? "text-red-600 dark:text-red-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "info"
          ? "text-sky-600 dark:text-sky-400"
          : "text-foreground";
  return (
    <div className={cn("rounded-lg border p-3 text-center transition-colors", toneCls)}>
      <Icon className={cn("mx-auto mb-1 size-4", textCls)} aria-hidden="true" />
      <p className={cn("text-2xl font-bold tabular-nums", textCls)}>{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
