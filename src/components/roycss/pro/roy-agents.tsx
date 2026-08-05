"use client";

/**
 * RoyAgents — eight specialized AI engineering agents for RoyCSS.
 *
 * Each agent simulates a 2-second audit of the current project and
 * returns a list of findings (severity, description, fix). The
 * "Run All Agents" button sequences every agent and drives a combined
 * progress bar; the results panel surfaces the most recent run.
 *
 * Features:
 *   • 8 agent cards — icon, name, description, 3–5 capability bullets,
 *     a "Run Agent" button with simulated progress, and a status badge
 *     (Available / Running / Completed).
 *   • Per-agent run — 2s progress animation, then 3–5 findings with
 *     severity badges (Critical / Warning / Info).
 *   • "Run All Agents" — sequential run with a combined progress bar
 *     and a live "completed / total" counter.
 *   • Results panel — the most recent agent's findings, each with
 *     severity, description, and a fix recommendation.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, no API calls.
 *   • Simulated async via setTimeout / setInterval. Every timer id is
 *     registered in a ref Set and cleared on unmount — no leaks.
 *   • TS strict, zero `any`. Exhaustiveness `never` guard on severity.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     warnings, rose for criticals, sky for info accents. No indigo /
 *     blue anywhere.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Accessibility,
  AlertOctagon,
  AlertTriangle,
  ArrowRightLeft,
  Bot,
  CheckCircle2,
  FileText,
  FlaskConical,
  Gauge,
  Info,
  Layers,
  Loader2,
  type LucideIcon,
  Palette,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Severity = "critical" | "warning" | "info";

type AgentStatus = "available" | "running" | "completed";

interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  fix: string;
}

interface AgentDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind classes for the icon tile bg/text
  capabilities: string[];
  findings: Finding[];
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function fid(seed: string, n: number): string {
  return `${seed}-f-${n}`;
}

function findingCount(f: Finding[]): { critical: number; warning: number; info: number } {
  return {
    critical: f.filter((x) => x.severity === "critical").length,
    warning: f.filter((x) => x.severity === "warning").length,
    info: f.filter((x) => x.severity === "info").length,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Agent catalogue — 8 specialized agents with precomputed mock findings.
// ═══════════════════════════════════════════════════════════════════════

const AGENTS: readonly AgentDef[] = [
  {
    id: "accessibility",
    name: "Accessibility Agent",
    description:
      "Audits pages for WCAG compliance and suggests concrete fixes.",
    icon: Accessibility,
    accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    capabilities: [
      "WCAG 2.2 AA / AAA contrast checks",
      "Keyboard navigation + focus order audit",
      "ARIA role + label validation",
      "Reduced-motion + screen reader review",
    ],
    findings: [
      {
        id: fid("a11y", 1),
        severity: "critical",
        title: "Form input missing label association",
        description:
          "The email field has a visible <label> but no htmlFor→id link, so screen readers cannot announce the field name.",
        fix: 'Add htmlFor="email" to the <label> matching the input id, or wrap the input inside the <label>.',
      },
      {
        id: fid("a11y", 2),
        severity: "warning",
        title: "Color contrast 3.2:1 below WCAG AA (4.5:1)",
        description:
          "Body text on the muted background falls below the AA threshold for normal text.",
        fix: "Darken the foreground to oklch(0.45 0.13 165) or use the --text-strong token.",
      },
      {
        id: fid("a11y", 3),
        severity: "warning",
        title: "Interactive element lacks focus-visible style",
        description:
          "The icon-only button has no visible focus ring, making keyboard navigation ambiguous.",
        fix: "Add focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 to the element.",
      },
      {
        id: fid("a11y", 4),
        severity: "info",
        title: "Image missing alt attribute",
        description:
          "The hero <img> has no alt text, which fails WCAG 1.1.1 Non-text Content.",
        fix: 'Provide a descriptive alt, or alt="" for decorative images.',
      },
      {
        id: fid("a11y", 5),
        severity: "info",
        title: "Heading order skips from h2 to h4",
        description:
          "The page jumps from an h2 directly to an h4, breaking the document outline.",
        fix: "Use headings in sequential order without skipping levels.",
      },
    ],
  },
  {
    id: "performance",
    name: "Performance Agent",
    description:
      "Analyzes CSS / JS payload and recommends concrete optimizations.",
    icon: Gauge,
    accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    capabilities: [
      "Critical CSS extraction audit",
      "Unused CSS detection + purge map",
      "Render-blocking resource scan",
      "Layout shift (CLS) hotspot finder",
      "Bundle size regression tracker",
    ],
    findings: [
      {
        id: fid("perf", 1),
        severity: "critical",
        title: "14 KB of unused CSS shipped on first load",
        description:
          "About 38% of the homepage stylesheet is never matched by any element above the fold.",
        fix: "Split the stylesheet by route, or use @media to lazy-load non-critical rules.",
      },
      {
        id: fid("perf", 2),
        severity: "warning",
        title: "Layout shift detected on hero image (CLS 0.18)",
        description:
          "The hero image loads without reserved space, pushing content down on hydration.",
        fix: "Set explicit width/height or wrap in aspect-ratio to reserve space before load.",
      },
      {
        id: fid("perf", 3),
        severity: "warning",
        title: "Unminified CSS payload (43 KB → est. 18 KB after minify)",
        description:
          "Production build is shipping unminified CSS with comments and whitespace intact.",
        fix: "Enable CSS minification in the build pipeline (cssnano / lightningcss).",
      },
      {
        id: fid("perf", 4),
        severity: "info",
        title: "Three render-blocking stylesheets on first paint",
        description:
          "All three stylesheets are loaded synchronously in <head>, delaying first paint by ~120 ms.",
        fix: 'Inline critical CSS, defer the rest with media="print" onload="this.media=\'all\'".',
      },
      {
        id: fid("perf", 5),
        severity: "info",
        title: "Duplicate keyframe definitions across 4 files",
        description:
          "The same @keyframes spin appears in 4 separate files, inflating the bundle.",
        fix: "Extract shared keyframes into a single @keyframes block in tokens.css.",
      },
    ],
  },
  {
    id: "documentation",
    name: "Documentation Agent",
    description:
      "Generates docs from code and writes README sections automatically.",
    icon: FileText,
    accent: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    capabilities: [
      "JSDoc / TSDoc extraction",
      "README section generation",
      "Public API surface map",
      "Prop table regeneration",
      "Changelog drafting",
    ],
    findings: [
      {
        id: fid("docs", 1),
        severity: "warning",
        title: "5 public exports undocumented",
        description:
          "Five exports in the package entry have no JSDoc, making the public API surface unclear.",
        fix: "Add a /** ... */ block with @param and @returns for each exported symbol.",
      },
      {
        id: fid("docs", 2),
        severity: "warning",
        title: "README missing installation section",
        description:
          "The README jumps straight into usage without showing how to install the package.",
        fix: "Append a ## Installation block with npm install and import snippet.",
      },
      {
        id: fid("docs", 3),
        severity: "info",
        title: "Component Button has no JSDoc",
        description:
          "The Button component file has no top-of-file docstring describing its props or variants.",
        fix: "Add a JSDoc block above the component describing props, defaults, and a usage example.",
      },
      {
        id: fid("docs", 4),
        severity: "info",
        title: "Stale prop table in Button.mdx",
        description:
          "The prop table in Button.mdx is out of sync with the current TypeScript types.",
        fix: "Regenerate prop tables from the TypeScript types using the docs plugin.",
      },
      {
        id: fid("docs", 5),
        severity: "info",
        title: "No CHANGELOG entry for v2.1.0",
        description:
          "The CHANGELOG stops at v2.0.4, but the package.json version is 2.1.0.",
        fix: "Add a ## [2.1.0] section summarizing additions, fixes, and breaking changes.",
      },
    ],
  },
  {
    id: "refactoring",
    name: "Refactoring Agent",
    description: "Identifies code smells and suggests targeted refactors.",
    icon: RefreshCw,
    accent: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    capabilities: [
      "Component size + complexity scan",
      "Duplication detector",
      "Magic-number extractor",
      "Prop-drilling flagger",
      "Switch → lookup map refactor",
    ],
    findings: [
      {
        id: fid("refactor", 1),
        severity: "warning",
        title: "Component UserCard exceeds 380 lines",
        description:
          "UserCard renders avatar, metadata, and action menu in a single file, making it hard to test.",
        fix: "Split into UserAvatar, UserMeta, and UserActions subcomponents in the same directory.",
      },
      {
        id: fid("refactor", 2),
        severity: "warning",
        title: "Duplicated gradient utility in 7 files",
        description:
          "The same linear-gradient string is copy-pasted into 7 components, causing drift.",
        fix: "Extract into a gradient-emerald class in tokens.css and reference the token.",
      },
      {
        id: fid("refactor", 3),
        severity: "warning",
        title: "Prop drilling 4 levels deep for theme",
        description:
          "The theme string is passed through 4 layers of components to reach the leaf.",
        fix: "Lift theme into a React context provider and consume it with useContext at the leaf.",
      },
      {
        id: fid("refactor", 4),
        severity: "info",
        title: "Inline magic number 0.4375rem",
        description:
          "The value 0.4375rem appears inline in 3 places instead of referencing a token.",
        fix: "Replace with the --space-1.5 design token for consistency.",
      },
      {
        id: fid("refactor", 5),
        severity: "info",
        title: "Switch statement with 9 cases",
        description:
          "The action dispatcher uses a 9-case switch, which is O(n) and hard to extend.",
        fix: "Use a Record<Action, Handler> lookup map for O(1) dispatch.",
      },
    ],
  },
  {
    id: "design-review",
    name: "Design Review Agent",
    description:
      "Checks design consistency — spacing, color usage, and elevation.",
    icon: Palette,
    accent: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    capabilities: [
      "Spacing scale enforcement",
      "Color drift detector",
      "Radius / shadow consistency",
      "CTA hierarchy review",
      "Token coverage report",
    ],
    findings: [
      {
        id: fid("design", 1),
        severity: "critical",
        title: "Brand color drift: 4 distinct 'emerald' values detected",
        description:
          "Four different green values are used across the app instead of the canonical --primary token.",
        fix: "Replace ad-hoc green colors with the --primary token and its scale.",
      },
      {
        id: fid("design", 2),
        severity: "warning",
        title: "Spacing scale inconsistent: 12/14/16 px in same view",
        description:
          "The card grid mixes 12, 14, and 16 px gaps, breaking the modular scale.",
        fix: "Constrain to the 4 / 8 / 12 / 16 / 24 modular scale defined in --space-* tokens.",
      },
      {
        id: fid("design", 3),
        severity: "warning",
        title: "Three primary button variants on the landing page",
        description:
          "Three CTAs compete for primary emphasis on the same screen, diluting the hierarchy.",
        fix: "Use a single primary CTA per view; demote the others to secondary or ghost.",
      },
      {
        id: fid("design", 4),
        severity: "info",
        title: "Border radius varies (6 / 8 / 10 / 12 px)",
        description:
          "Four different radii are used across cards, inputs, and buttons with no clear system.",
        fix: "Standardize on the --radius token and its --radius-sm / --radius-lg scale.",
      },
      {
        id: fid("design", 5),
        severity: "info",
        title: "Shadow depth jumps from 1 to 4 without intermediate",
        description:
          "Elevation goes from shadow-sm directly to shadow-2xl, skipping intermediate steps.",
        fix: "Adopt the --shadow-1 / 2 / 3 / 4 elevation scale for smooth depth progression.",
      },
    ],
  },
  {
    id: "migration",
    name: "Migration Agent",
    description:
      "Migrates CSS from Bootstrap, Tailwind, and Material to RoyCSS.",
    icon: ArrowRightLeft,
    accent: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    capabilities: [
      "Bootstrap utility class mapper",
      "Tailwind @apply converter",
      "Material elevation translator",
      "Vendor-prefix stripper",
      "!important removal",
    ],
    findings: [
      {
        id: fid("migrate", 1),
        severity: "critical",
        title: "12 Bootstrap utility classes need conversion",
        description:
          "Classes like d-flex, p-3, and text-center are still present in 4 templates.",
        fix: "Map d-flex → flex, p-3 → p-3, text-center → text-center using the migration table.",
      },
      {
        id: fid("migrate", 2),
        severity: "warning",
        title: "Tailwind @apply directives in 3 files",
        description:
          "Three CSS files use @apply with Tailwind primitives instead of native RoyCSS classes.",
        fix: "Replace @apply with native RoyCSS utility classes or @layer declarations.",
      },
      {
        id: fid("migrate", 3),
        severity: "warning",
        title: "Material mat-elevation calls in 2 components",
        description:
          "Two components still call mat-elevation(2) and mat-elevation(5).",
        fix: "Replace with shadow-sm / shadow-md from the RoyCSS elevation scale.",
      },
      {
        id: fid("migrate", 4),
        severity: "info",
        title: "8 hardcoded !important flags",
        description:
          "Eight declarations use !important to override specificity instead of fixing the cascade.",
        fix: "Increase specificity or use RoyCSS layer ordering; remove !important.",
      },
      {
        id: fid("migrate", 5),
        severity: "info",
        title: "Vendor-prefixed properties duplicated",
        description:
          "-webkit- and -moz- prefixes are written manually in 6 places.",
        fix: "Use the @supports query + autoprefixer pipeline; remove manual prefixes.",
      },
    ],
  },
  {
    id: "test-generation",
    name: "Test Generation Agent",
    description:
      "Generates unit and integration tests for components and hooks.",
    icon: FlaskConical,
    accent: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    capabilities: [
      "Unit test scaffold generation",
      "Integration / e2e test drafts",
      "Snapshot baseline creation",
      "Hook edge-case enumeration",
      "Accessibility test setup",
    ],
    findings: [
      {
        id: fid("test", 1),
        severity: "critical",
        title: "Critical component PaymentForm has 0% coverage",
        description:
          "PaymentForm handles money but has no unit or integration tests at all.",
        fix: "Generate unit tests for prop validation, validation errors, and submit handlers.",
      },
      {
        id: fid("test", 2),
        severity: "warning",
        title: "No integration tests for /checkout flow",
        description:
          "The checkout flow has no e2e coverage; regressions ship undetected.",
        fix: "Add Playwright e2e tests covering the happy path and 3 error states.",
      },
      {
        id: fid("test", 3),
        severity: "warning",
        title: "Edge cases for useTheme hook untested",
        description:
          "useTheme has no tests for system preference, manual toggle, or persistence.",
        fix: "Add tests for system preference, manual toggle, and localStorage persistence.",
      },
      {
        id: fid("test", 4),
        severity: "info",
        title: "Snapshot tests missing for 9 components",
        description:
          "Nine presentational components have no snapshot baselines to catch visual regressions.",
        fix: "Add toMatchSnapshot() baseline tests to catch unintended visual changes.",
      },
      {
        id: fid("test", 5),
        severity: "info",
        title: "No accessibility test setup",
        description:
          "The e2e suite does not run any automated accessibility checks.",
        fix: "Add @axe-core/playwright to the e2e suite for automated a11y assertions.",
      },
    ],
  },
  {
    id: "security",
    name: "Security Agent",
    description:
      "Scans for XSS, CSRF, and injection vulnerabilities in code.",
    icon: ShieldCheck,
    accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    capabilities: [
      "XSS / HTML injection scanner",
      "CSRF token audit",
      "Cookie attribute validator",
      "dangerouslySetInnerHTML finder",
      "Source map exposure check",
    ],
    findings: [
      {
        id: fid("sec", 1),
        severity: "critical",
        title: "Unsanitized dangerouslySetInnerHTML in MarkdownRenderer",
        description:
          "MarkdownRenderer passes user-supplied HTML straight to dangerouslySetInnerHTML without sanitization.",
        fix: "Run the input through DOMPurify.sanitize() before rendering.",
      },
      {
        id: fid("sec", 2),
        severity: "critical",
        title: "Form action submits to an HTTP endpoint",
        description:
          "The login form posts to http://api.example.com, exposing credentials to MITM attacks.",
        fix: "Switch to HTTPS, add a CSRF token header, and validate the token on the server.",
      },
      {
        id: fid("sec", 3),
        severity: "warning",
        title: "Inline onclick handler with user-controlled string",
        description:
          "A button's onclick attribute interpolates a user-supplied value directly into the handler.",
        fix: "Use addEventListener with sanitized input; never interpolate user data into handlers.",
      },
      {
        id: fid("sec", 4),
        severity: "warning",
        title: "Cookie set without SameSite attribute",
        description:
          "The session cookie has no SameSite flag, leaving it open to CSRF attacks.",
        fix: "Set SameSite=Strict and Secure on all session cookies.",
      },
      {
        id: fid("sec", 5),
        severity: "info",
        title: "Source map files exposed in production",
        description:
          ".map files are served publicly, leaking original source code structure.",
        fix: "Disable source maps in production builds or serve them behind authenticated routes.",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Static UI helpers — severity badges + icons.
// ═══════════════════════════════════════════════════════════════════════

function severityClasses(sev: Severity): string {
  switch (sev) {
    case "critical":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "warning":
      return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "info":
      return "border-primary/30 bg-primary/10 text-primary";
    default: {
      const _exhaustive: never = sev;
      return _exhaustive;
    }
  }
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const label = severity === "critical"
    ? "Critical"
    : severity === "warning"
      ? "Warning"
      : "Info";
  const Icon = severity === "critical"
    ? AlertOctagon
    : severity === "warning"
      ? AlertTriangle
      : Info;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 capitalize", severityClasses(severity))}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: AgentStatus }) {
  switch (status) {
    case "available":
      return (
        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
          <span className="bg-muted-foreground/60 size-1.5 rounded-full" aria-hidden />
          Available
        </Badge>
      );
    case "running":
      return (
        <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Running
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-3" aria-hidden />
          Completed
        </Badge>
      );
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// AgentCard
// ═══════════════════════════════════════════════════════════════════════

interface AgentCardProps {
  agent: AgentDef;
  status: AgentStatus;
  progress: number;
  hasResults: boolean;
  isSelected: boolean;
  runAllActive: boolean;
  onRun: (agentId: string) => void;
  onSelect: (agentId: string) => void;
}

function AgentCard({
  agent,
  status,
  progress,
  hasResults,
  isSelected,
  runAllActive,
  onRun,
  onSelect,
}: AgentCardProps) {
  const Icon = agent.icon;
  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const disabled = isRunning || runAllActive;
  const counts = hasResults ? findingCount(agent.findings) : null;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition-shadow",
        isSelected && "ring-primary/40 ring-2",
        isRunning && "shadow-md"
      )}
    >
      <CardHeader className="gap-3 px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                agent.accent
              )}
              aria-hidden
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm leading-tight">
                {agent.name}
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs leading-snug">
                {agent.description}
              </CardDescription>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="px-5 py-3">
        <ul className="space-y-1.5">
          {agent.capabilities.map((cap) => (
            <li
              key={cap}
              className="text-muted-foreground flex items-start gap-2 text-xs"
            >
              <CheckCircle2
                className="mt-0.5 size-3.5 shrink-0 text-emerald-500/70"
                aria-hidden
              />
              <span>{cap}</span>
            </li>
          ))}
        </ul>

        {/* Progress bar — visible only while running. */}
        {isRunning && (
          <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-muted-foreground text-[11px] tabular-nums">
              Analyzing… {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Result summary — visible once completed. */}
        {isCompleted && counts && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="border-destructive/30 bg-destructive/10 text-destructive gap-1 text-[11px]"
            >
              <AlertOctagon className="size-3" aria-hidden />
              {counts.critical} critical
            </Badge>
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[11px]"
            >
              <AlertTriangle className="size-3" aria-hidden />
              {counts.warning} warning
            </Badge>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary gap-1 text-[11px]"
            >
              <Info className="size-3" aria-hidden />
              {counts.info} info
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/30 gap-2 px-5 py-3">
        <Button
          type="button"
          size="sm"
          onClick={() => onRun(agent.id)}
          disabled={disabled}
          className="gap-1.5"
        >
          {isRunning ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Running…
            </>
          ) : isCompleted ? (
            <>
              <RotateCcw className="size-3.5" aria-hidden />
              Run Again
            </>
          ) : (
            <>
              <Play className="size-3.5" aria-hidden />
              Run Agent
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onSelect(agent.id)}
          disabled={!hasResults}
          className="gap-1.5"
        >
          <Layers className="size-3.5" aria-hidden />
          View Results
        </Button>
      </CardFooter>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ResultsPanel
// ═══════════════════════════════════════════════════════════════════════

interface ResultsPanelProps {
  agent: AgentDef | null;
  hasResults: boolean;
}

function ResultsPanel({ agent, hasResults }: ResultsPanelProps) {
  if (!agent || !hasResults) {
    return (
      <Card className="border-dashed py-6">
        <CardContent className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
            <Bot className="size-6" aria-hidden />
          </div>
          <p className="text-sm font-medium">No results yet</p>
          <p className="text-muted-foreground max-w-sm text-xs">
            Run an agent to see its findings here. Findings include a
            severity badge, a description, and a fix recommendation.
          </p>
        </CardContent>
      </Card>
    );
  }

  const counts = findingCount(agent.findings);
  const Icon = agent.icon;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      {/* Panel header */}
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            agent.accent
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {agent.name} — Findings
            </span>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 gap-1"
            >
              <CheckCircle2 className="size-3" aria-hidden />
              Completed
            </Badge>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {agent.findings.length} findings · {counts.critical} critical ·{" "}
            {counts.warning} warning · {counts.info} info
          </p>
        </div>
      </div>

      {/* Findings list */}
      <div className="max-h-[28rem] overflow-y-auto p-4">
        <ol className="space-y-3">
          {agent.findings.map((finding, idx) => (
            <li
              key={finding.id}
              className="bg-muted/30 rounded-lg border p-3"
            >
              <div className="flex items-start gap-3">
                <span
                  className="bg-background text-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums"
                  aria-hidden
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={finding.severity} />
                    <span className="text-sm font-medium leading-tight">
                      {finding.title}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {finding.description}
                  </p>
                  <div className="bg-background mt-2 rounded-md border border-dashed p-2.5">
                    <p className="text-muted-foreground mb-0.5 text-[11px] font-medium uppercase tracking-wide">
                      Recommended fix
                    </p>
                    <p className="text-foreground text-xs leading-relaxed">
                      {finding.fix}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyAgents — the exported component.
// ═══════════════════════════════════════════════════════════════════════

const RUN_DURATION_MS = 2000;
const TICK_MS = 50;
const INTER_AGENT_DELAY_MS = 120;

export function RoyAgents() {
  // Per-agent state. Keys are agent ids; values default to "available" / 0 / absent.
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>(
    () => Object.fromEntries(AGENTS.map((a) => [a.id, "available" as AgentStatus]))
  );
  const [progress, setProgress] = useState<Record<string, number>>(
    () => Object.fromEntries(AGENTS.map((a) => [a.id, 0]))
  );
  const [results, setResults] = useState<Record<string, Finding[]>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Run-all state.
  const [runAllActive, setRunAllActive] = useState(false);
  const [runAllProgress, setRunAllProgress] = useState(0);
  const [runAllCompleted, setRunAllCompleted] = useState(0);

  // Timer registry — every setInterval / setTimeout id is stored here
  // and cleared on unmount so we never leak a timer.
  const timersRef = useRef<Set<number>>(new Set());
  const runAllCancelledRef = useRef(false);

  const registerTimer = useCallback((id: number): number => {
    timersRef.current.add(id);
    return id;
  }, []);

  const clearTimer = useCallback((id: number): void => {
    window.clearInterval(id);
    window.clearTimeout(id);
    timersRef.current.delete(id);
  }, []);

  // Cleanup all timers on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => {
        window.clearInterval(id);
        window.clearTimeout(id);
      });
      timers.clear();
      runAllCancelledRef.current = true;
    };
  }, []);

  /**
   * Kick off a single agent run. Animates the per-agent progress bar
   * from 0 → 100 over RUN_DURATION_MS, then drops in the agent's
   * findings and selects that agent in the results panel.
   */
  const runAgent = useCallback(
    (agentId: string): void => {
      const agent = AGENTS.find((a) => a.id === agentId);
      if (!agent) return;
      if (statuses[agentId] === "running") return;

      setStatuses((prev) => ({ ...prev, [agentId]: "running" }));
      setProgress((prev) => ({ ...prev, [agentId]: 0 }));
      setSelectedAgentId(agentId);

      const start = Date.now();
      const intervalId = window.setInterval(() => {
        const elapsed = Date.now() - start;
        const pct = Math.min(100, (elapsed / RUN_DURATION_MS) * 100);
        setProgress((prev) => ({ ...prev, [agentId]: pct }));
        if (pct >= 100) {
          clearTimer(intervalId);
          setStatuses((prev) => ({ ...prev, [agentId]: "completed" }));
          setResults((prev) => ({ ...prev, [agentId]: agent.findings }));
          // selectedAgentId is already set, but reaffirm in case the
          // user clicked another card in the meantime.
          setSelectedAgentId(agentId);
        }
      }, TICK_MS);
      registerTimer(intervalId);
    },
    [statuses, clearTimer, registerTimer]
  );

  /**
   * Run every agent sequentially. Each agent animates its own progress
   * bar; the combined progress bar reflects the weighted average across
   * all 8 agents. A short pause between agents makes the sequence
   * legible to the user.
   */
  const runAllAgents = useCallback((): void => {
    if (runAllActive) return;
    runAllCancelledRef.current = false;
    setRunAllActive(true);
    setRunAllProgress(0);
    setRunAllCompleted(0);

    // Reset every agent's status + progress before starting the batch.
    setStatuses(Object.fromEntries(AGENTS.map((a) => [a.id, "available" as AgentStatus])));
    setProgress(Object.fromEntries(AGENTS.map((a) => [a.id, 0])));
    setResults({});

    const total = AGENTS.length;
    let index = 0;

    const runNext = (): void => {
      if (runAllCancelledRef.current) return;
      if (index >= total) {
        setRunAllActive(false);
        setRunAllProgress(100);
        return;
      }
      const agent = AGENTS[index];
      if (!agent) {
        index += 1;
        const t = window.setTimeout(runNext, INTER_AGENT_DELAY_MS);
        registerTimer(t);
        return;
      }

      setStatuses((prev) => ({ ...prev, [agent.id]: "running" }));
      setProgress((prev) => ({ ...prev, [agent.id]: 0 }));
      setSelectedAgentId(agent.id);

      const start = Date.now();
      const intervalId = window.setInterval(() => {
        if (runAllCancelledRef.current) {
          clearTimer(intervalId);
          return;
        }
        const elapsed = Date.now() - start;
        const pct = Math.min(100, (elapsed / RUN_DURATION_MS) * 100);
        setProgress((prev) => ({ ...prev, [agent.id]: pct }));
        setRunAllProgress(((index + pct / 100) / total) * 100);
        if (pct >= 100) {
          clearTimer(intervalId);
          setStatuses((prev) => ({ ...prev, [agent.id]: "completed" }));
          setResults((prev) => ({ ...prev, [agent.id]: agent.findings }));
          setSelectedAgentId(agent.id);
          setRunAllCompleted(index + 1);
          index += 1;
          const t = window.setTimeout(runNext, INTER_AGENT_DELAY_MS);
          registerTimer(t);
        }
      }, TICK_MS);
      registerTimer(intervalId);
    };

    // Tiny defer so the "running" state is visible before the first tick.
    const initial = window.setTimeout(runNext, 0);
    registerTimer(initial);
  }, [runAllActive, clearTimer, registerTimer]);

  /** Reset every agent back to Available and clear all results. */
  const handleReset = useCallback((): void => {
    if (runAllActive) {
      runAllCancelledRef.current = true;
      setRunAllActive(false);
    }
    // Clear any in-flight timers.
    timersRef.current.forEach((id) => {
      window.clearInterval(id);
      window.clearTimeout(id);
    });
    timersRef.current.clear();
    setStatuses(Object.fromEntries(AGENTS.map((a) => [a.id, "available" as AgentStatus])));
    setProgress(Object.fromEntries(AGENTS.map((a) => [a.id, 0])));
    setResults({});
    setRunAllProgress(0);
    setRunAllCompleted(0);
    setSelectedAgentId(null);
  }, [runAllActive]);

  const handleSelect = useCallback((agentId: string): void => {
    setSelectedAgentId(agentId);
  }, []);

  const selectedAgent = selectedAgentId
    ? (AGENTS.find((a) => a.id === selectedAgentId) ?? null)
    : null;
  const selectedHasResults = selectedAgentId
    ? Boolean(results[selectedAgentId])
    : false;

  const totalCompleted = AGENTS.filter(
    (a) => statuses[a.id] === "completed"
  ).length;
  const totalFindings = AGENTS.reduce(
    (sum, a) => sum + (results[a.id]?.length ?? 0),
    0
  );

  return (
    <Card className="gap-0 overflow-hidden py-0">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold leading-tight">
                Roy Agents
              </h2>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary gap-1 text-[10px] uppercase tracking-wide"
              >
                <Zap className="size-3" aria-hidden />
                {AGENTS.length} agents
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 max-w-xl text-xs leading-relaxed">
              Specialized AI engineering agents that audit your project
              for accessibility, performance, design consistency,
              security, and more. Each agent runs a simulated audit and
              returns prioritized findings with fix recommendations.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={runAllActive}
            className="gap-1.5"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={runAllAgents}
            disabled={runAllActive}
            className="gap-1.5"
          >
            {runAllActive ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Running {runAllCompleted} / {AGENTS.length}
              </>
            ) : (
              <>
                <Play className="size-3.5" aria-hidden />
                Run All Agents
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Run-all progress bar ───────────────────────────────────── */}
      {runAllActive && (
        <div className="bg-muted/30 space-y-1.5 border-b px-5 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Running all agents sequentially…
            </span>
            <span className="font-medium tabular-nums">
              {Math.round(runAllProgress)}%
            </span>
          </div>
          <Progress value={runAllProgress} className="h-1.5" />
          <p className="text-muted-foreground text-[11px]">
            {runAllCompleted} of {AGENTS.length} agents complete ·{" "}
            {AGENTS.length - runAllCompleted} remaining
          </p>
        </div>
      )}

      {/* ── Stats strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x border-b text-center">
        <div className="px-3 py-3">
          <p className="text-foreground text-lg font-semibold tabular-nums">
            {totalCompleted}
            <span className="text-muted-foreground text-xs font-normal">
              {" "}/ {AGENTS.length}
            </span>
          </p>
          <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
            Agents run
          </p>
        </div>
        <div className="px-3 py-3">
          <p className="text-foreground text-lg font-semibold tabular-nums">
            {totalFindings}
          </p>
          <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
            Total findings
          </p>
        </div>
        <div className="px-3 py-3">
          <p className="text-foreground text-lg font-semibold tabular-nums">
            {AGENTS.reduce(
              (sum, a) =>
                sum + (results[a.id]?.filter((f) => f.severity === "critical").length ?? 0),
              0
            )}
          </p>
          <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
            Critical issues
          </p>
        </div>
      </div>

      {/* ── Agent grid + results ──────────────────────────────────── */}
      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left: agent cards */}
        <div
          className="grid gap-3 sm:grid-cols-2"
          role="list"
          aria-label="Available agents"
        >
          {AGENTS.map((agent) => (
            <div key={agent.id} role="listitem">
              <AgentCard
                agent={agent}
                status={statuses[agent.id] ?? "available"}
                progress={progress[agent.id] ?? 0}
                hasResults={Boolean(results[agent.id])}
                isSelected={selectedAgentId === agent.id}
                runAllActive={runAllActive}
                onRun={runAgent}
                onSelect={handleSelect}
              />
            </div>
          ))}
        </div>

        {/* Right: results panel (sticky on large screens) */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <ResultsPanel
            agent={selectedAgent}
            hasResults={selectedHasResults}
          />
        </div>
      </div>
    </Card>
  );
}
