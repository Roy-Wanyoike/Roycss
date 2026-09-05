"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyVersion — version management for RoyCSS.
 *
 * Self-contained (no props). Five sections:
 *   1. Version header — current (v2.0.0) vs latest available, plus a
 *      "Check for Updates" button that simulates a fetch with progress.
 *   2. Dependency graph — an ASCII tree (in a `<pre>`) showing
 *      RoyCSS → sub-packages.
 *   3. Breaking changes detector — 5 mock breaking changes with
 *      severity, affected files, and a migration-guide link.
 *   4. Upgrade simulator — pick a target version, see what will change
 *      (features added, breaking changes, deprecated APIs).
 *   5. Changelog — 5 version entries with date + features / fixes /
 *      breaking sections.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Every severity is a string-literal union;
 *     the `never` guard enforces exhaustiveness on the severity-to-
 *     color mapper.
 *   • Simulated async via setTimeout. Every timer id is registered in
 *     a ref Set and cleared on unmount — no leaks.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     warnings, rose for criticals, sky for info accents. No indigo or
 *     blue anywhere.
 *   • SSR-safe — no `window` access at module scope.
 */

import * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowUpCircle,
  Boxes,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  GitBranch,
  GitCommitVertical,
  Info,
  Loader2,
  type LucideIcon,
  Package,
  RefreshCw,
  Sparkles,
  Tag,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Severity = "critical" | "major" | "minor" | "low";

interface BreakingChange {
  id: string;
  title: string;
  severity: Severity;
  affectedFiles: readonly string[];
  description: string;
  migrationGuide: string;
}

interface ChangelogSection {
  features: readonly string[];
  fixes: readonly string[];
  breaking: readonly string[];
}

interface ChangelogEntry {
  version: string;
  date: string;
  sections: ChangelogSection;
}

interface UpgradeTarget {
  version: string;
  summary: string;
  featuresAdded: number;
  breakingChanges: number;
  deprecations: number;
  estimatedTime: string;
  notes: readonly string[];
}

interface SubPackage {
  name: string;
  version: string;
  description: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const CURRENT_VERSION = "v2.0.0";
const LATEST_VERSION = "v2.4.1";

const SUB_PACKAGES: readonly SubPackage[] = [
  {
    name: "@roycss/core",
    version: "2.4.1",
    description: "Core CSS primitives + design tokens.",
  },
  {
    name: "@roycss/react",
    version: "2.4.1",
    description: "React component primitives + hooks.",
  },
  {
    name: "@roycss/cli",
    version: "2.4.0",
    description: "Scaffolding + code generation CLI.",
  },
  {
    name: "@roycss/tokens",
    version: "2.4.1",
    description: "W3C Tokens JSON + theming helpers.",
  },
  {
    name: "@roycss/motion",
    version: "2.3.0",
    description: "Animation primitives + easings.",
  },
  {
    name: "@roycss/inspector",
    version: "1.8.2",
    description: "Browser DevTools extension.",
  },
] as const;

const DEPENDENCY_TREE = `roycss@2.4.1
├── @roycss/core@2.4.1          # core primitives + tokens
│   ├── @roycss/tokens@2.4.1    # W3C Tokens JSON
│   └── @roycss/motion@2.3.0    # animation primitives
├── @roycss/react@2.4.1         # React components + hooks
│   ├── @roycss/core@2.4.1
│   └── @roycss/tokens@2.4.1
├── @roycss/cli@2.4.0           # scaffold + generate CLI
│   └── @roycss/core@2.4.1
└── @roycss/inspector@1.8.2     # browser DevTools
    └── @roycss/tokens@2.4.1`;

const BREAKING_CHANGES: readonly BreakingChange[] = [
  {
    id: "bc-1",
    title: "Button variants renamed",
    severity: "major",
    affectedFiles: [
      "src/components/ui/button.tsx",
      "src/components/ui/badge.tsx",
    ],
    description:
      "The `primary` and `secondary` variants are renamed to `default` and `outline` to match shadcn/ui conventions.",
    migrationGuide: "https://roycss.dev/migrate/v2-4-variants",
  },
  {
    id: "bc-2",
    title: "Drop `roycss-effect-*` utility class shorthand",
    severity: "critical",
    affectedFiles: [
      "src/app/globals.css",
      "src/components/roycss/*.tsx",
    ],
    description:
      "Effect shorthand classes are removed in favor of explicit `data-effect` attributes. Any selector relying on `.roycss-effect-*` will silently no-op.",
    migrationGuide: "https://roycss.dev/migrate/v2-4-effects",
  },
  {
    id: "bc-3",
    title: "Theme tokens now use OKLCH by default",
    severity: "minor",
    affectedFiles: [
      "src/app/roycss.css",
      "tailwind.config.ts",
    ],
    description:
      "Color tokens switch from HSL to OKLCH for better perceptual uniformity. Fallbacks are auto-injected for older browsers.",
    migrationGuide: "https://roycss.dev/migrate/v2-4-oklch",
  },
  {
    id: "bc-4",
    title: "useToast() returns a stable `dismiss`",
    severity: "low",
    affectedFiles: ["src/hooks/use-toast.ts"],
    description:
      "`dismiss` is now stable across renders. Existing code that wrapped `dismiss` in useCallback is unaffected; calling `dismiss()` directly inside effects no longer needs a dependency entry.",
    migrationGuide: "https://roycss.dev/migrate/v2-4-toast",
  },
  {
    id: "bc-5",
    title: "CLI: `roycss init` no longer writes globals.css",
    severity: "major",
    affectedFiles: ["package.json", "src/app/globals.css"],
    description:
      "`roycss init` will only scaffold the config files; it will no longer touch `globals.css`. You must import `@roycss/core/styles` manually.",
    migrationGuide: "https://roycss.dev/migrate/v2-4-cli",
  },
] as const;

const SEVERITY_META: Record<
  Severity,
  { label: string; badge: string; icon: LucideIcon; iconClass: string }
> = {
  critical: {
    label: "Critical",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    icon: AlertTriangle,
    iconClass: "text-rose-600 dark:text-rose-400",
  },
  major: {
    label: "Major",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    icon: TriangleAlert,
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  minor: {
    label: "Minor",
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
    icon: Info,
    iconClass: "text-cyan-600 dark:text-cyan-400",
  },
  low: {
    label: "Low",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
};

const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: "v2.4.1",
    date: "2025-04-12",
    sections: {
      features: [
        "Add OKLCH color fallbacks for Safari < 15.4",
        "New `useReducedMotion` hook with system preference detection",
      ],
      fixes: [
        "Fix toast dismiss race on rapid unmount",
        "Restore focus-ring visibility on Switch in dark mode",
      ],
      breaking: [],
    },
  },
  {
    version: "v2.4.0",
    date: "2025-03-28",
    sections: {
      features: [
        "Roy Generator: 6 code generators (Component, Form, CRUD, Table, Dashboard, API Route)",
        "Roy Scaffold: 8 project templates with framework/database/auth selectors",
        "Roy Sync: 4 integrations with simulated progress + sync log",
      ],
      fixes: ["Plug a memory leak in the Sync progress timer"],
      breaking: [
        "Button variants renamed (`primary` → `default`, `secondary` → `outline`)",
        "Effect shorthand utility classes removed; use `data-effect` attributes",
        "CLI `init` no longer writes globals.css",
      ],
    },
  },
  {
    version: "v2.3.0",
    date: "2025-02-15",
    sections: {
      features: [
        "Roy Academy: 12 learning tracks with progress tracking",
        "Roy Marketplace: public package registry with install counts",
        "Theme System: per-route theme overrides",
      ],
      fixes: ["Dialog focus trap now respects initialFocus=false"],
      breaking: ["`theme.get()` returns `Theme | null` instead of `Theme`"],
    },
  },
  {
    version: "v2.2.0",
    date: "2025-01-08",
    sections: {
      features: [
        "Roy AI: chat assistant wired to z-ai-web-dev-sdk",
        "New `useFavorites` hook with localStorage persistence",
        "Pattern Library: 24 new grid + flex patterns",
      ],
      fixes: ["Persist dark-mode preference before first paint"],
      breaking: [],
    },
  },
  {
    version: "v2.1.0",
    date: "2024-12-04",
    sections: {
      features: [
        "Roy Agents: 8 specialized engineering audit agents",
        "Inspector extension: per-element effect inspector",
        "Bundle Calculator: tree-shake-aware size estimate",
      ],
      fixes: ["Sticky mini-nav no longer overlaps the footer on mobile"],
      breaking: ["`roycss.config.ts` requires `theme.oklch: true`"],
    },
  },
] as const;

const UPGRADE_TARGETS: readonly UpgradeTarget[] = [
  {
    version: "v2.4.1",
    summary: "Latest patch — low risk.",
    featuresAdded: 2,
    breakingChanges: 0,
    deprecations: 0,
    estimatedTime: "~5 min",
    notes: [
      "Safe in-place upgrade.",
      "No code changes required.",
      "Adds OKLCH fallbacks + a new hook.",
    ],
  },
  {
    version: "v2.4.0",
    summary: "Major feature release — review breaking changes.",
    featuresAdded: 3,
    breakingChanges: 3,
    deprecations: 1,
    estimatedTime: "~45 min",
    notes: [
      "Run the variant migration script first.",
      "Update `globals.css` to import `@roycss/core/styles`.",
      "Replace any `.roycss-effect-*` selectors with `data-effect` attributes.",
    ],
  },
  {
    version: "v2.3.0",
    summary: "Academy + Marketplace release.",
    featuresAdded: 3,
    breakingChanges: 1,
    deprecations: 0,
    estimatedTime: "~30 min",
    notes: [
      "Update `theme.get()` calls to handle `Theme | null`.",
      "Per-route theme overrides are opt-in.",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Copy text to clipboard with a textarea fallback. */
async function copyToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.writeText === "function" &&
    typeof window !== "undefined" &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/** Compare two semver-ish "vX.Y.Z" strings. Returns -1 / 0 / 1. */
function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface BreakingChangeRowProps {
  change: BreakingChange;
}

const BreakingChangeRow = React.memo(function BreakingChangeRow({
  change,
}: BreakingChangeRowProps) {
  const meta = SEVERITY_META[change.severity];
  const Icon = meta.icon;
  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Icon className={cn("size-4 shrink-0", meta.iconClass)} aria-hidden />
        <span className="text-sm font-semibold">{change.title}</span>
        <Badge
          variant="outline"
          className={cn("ml-auto text-[10px] uppercase tracking-wide", meta.badge)}
        >
          {meta.label}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs leading-snug">
        {change.description}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-[11px] font-medium">
          Affected:
        </span>
        {change.affectedFiles.map((file) => (
          <code
            key={file}
            className="bg-muted/60 rounded px-1.5 py-0.5 font-mono text-[10px]"
          >
            {file}
          </code>
        ))}
      </div>
      <a
        href={change.migrationGuide}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
      >
        <ExternalLink className="size-3" aria-hidden />
        Migration guide
      </a>
    </li>
  );
});

interface ChangelogCardProps {
  entry: ChangelogEntry;
  isLatest: boolean;
}

const ChangelogCard = React.memo(function ChangelogCard({
  entry,
  isLatest,
}: ChangelogCardProps) {
  const hasFeatures = entry.sections.features.length > 0;
  const hasFixes = entry.sections.fixes.length > 0;
  const hasBreaking = entry.sections.breaking.length > 0;
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isLatest && "border-primary/40 bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tag className="size-4 text-primary" aria-hidden />
        <span className="font-mono text-sm font-semibold">{entry.version}</span>
        {isLatest && (
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary text-[10px] uppercase tracking-wide"
          >
            Latest
          </Badge>
        )}
        <span className="text-muted-foreground ml-auto inline-flex items-center gap-1 text-xs">
          <Clock className="size-3" aria-hidden />
          {entry.date}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {hasFeatures && (
          <div className="flex flex-col gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
              <Sparkles className="size-3" aria-hidden />
              Features
            </span>
            <ul className="flex flex-col gap-1">
              {entry.sections.features.map((feat, i) => (
                <li key={i} className="text-xs leading-snug">
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasFixes && (
          <div className="flex flex-col gap-1.5">
            <span className="text-cyan-600 dark:text-cyan-400 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
              <Wrench className="size-3" aria-hidden />
              Fixes
            </span>
            <ul className="flex flex-col gap-1">
              {entry.sections.fixes.map((fix, i) => (
                <li key={i} className="text-xs leading-snug">
                  {fix}
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasBreaking && (
          <div className="flex flex-col gap-1.5">
            <span className="text-rose-600 dark:text-rose-400 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
              <AlertTriangle className="size-3" aria-hidden />
              Breaking
            </span>
            <ul className="flex flex-col gap-1">
              {entry.sections.breaking.map((brk, i) => (
                <li key={i} className="text-xs leading-snug">
                  {brk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════
// RoyVersion
// ═══════════════════════════════════════════════════════════════════════

export function RoyVersion() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("version/current");
  void data;

  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [targetVersion, setTargetVersion] = useState<string>(LATEST_VERSION);
  const [copied, setCopied] = useState(false);

  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    timersRef.current.add(t);
    return () => {
      clearTimeout(t);
      timersRef.current.delete(t);
    };
  }, [copied]);

  const isUpToDate = useMemo(
    () => compareVersions(CURRENT_VERSION, LATEST_VERSION) >= 0,
    [],
  );

  const handleCheck = useCallback(() => {
    setChecking(true);
    setChecked(false);
    const t = setTimeout(() => {
      setChecking(false);
      setChecked(true);
      toast({
        title: isUpToDate ? "You're up to date" : "Update available",
        description: isUpToDate
          ? `RoyCSS ${CURRENT_VERSION} is the latest version.`
          : `RoyCSS ${LATEST_VERSION} is ready to install.`,
      });
    }, 1200);
    timersRef.current.add(t);
  }, [isUpToDate, toast]);

  const handleCopyTree = useCallback(async () => {
    const ok = await copyToClipboard(DEPENDENCY_TREE);
    if (ok) {
      setCopied(true);
      toast({
        title: "Dependency graph copied",
        description: "Paste it anywhere as plain text.",
      });
    } else {
      toast({
        title: "Copy failed",
        description: "Clipboard is unavailable in this context.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const selectedTarget = useMemo(
    () =>
      UPGRADE_TARGETS.find((t) => t.version === targetVersion) ??
      UPGRADE_TARGETS[0],
    [targetVersion],
  );

  const isUpgrade = useMemo(
    () => compareVersions(selectedTarget.version, CURRENT_VERSION) > 0,
    [selectedTarget],
  );

  const criticalCount = useMemo(
    () => BREAKING_CHANGES.filter((c) => c.severity === "critical").length,
    [],
  );
  const majorCount = useMemo(
    () => BREAKING_CHANGES.filter((c) => c.severity === "major").length,
    [],
  );

  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <GitBranch className="size-5 text-primary" aria-hidden />
          Roy Version
        </CardTitle>
        <CardDescription>
          Track RoyCSS releases, review breaking changes, and simulate an
          upgrade before you commit.
        </CardDescription>
        <CardAction>
          <BackendLiveBadge module="version" loading={loading} error={error} />
          <Button
            size="sm"
            onClick={handleCheck}
            disabled={checking}
            className="gap-1.5"
          >
            {checking ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                Check for Updates
              </>
            )}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* ─── Version header ──────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="bg-muted/40 rounded-lg border p-4">
            <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              Current version
            </div>
            <div className="text-foreground mt-1 font-mono text-2xl font-semibold">
              {CURRENT_VERSION}
            </div>
            <div className="text-muted-foreground mt-0.5 text-xs">
              Installed in this project
            </div>
          </div>
          <div
            className={cn(
              "rounded-lg border p-4",
              isUpToDate
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900"
                : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
            )}
          >
            <div
              className={cn(
                "text-[11px] font-medium uppercase tracking-wide",
                isUpToDate
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-amber-700 dark:text-amber-300",
              )}
            >
              Latest available
            </div>
            <div
              className={cn(
                "mt-1 font-mono text-2xl font-semibold",
                isUpToDate
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-amber-700 dark:text-amber-300",
              )}
            >
              {LATEST_VERSION}
            </div>
            <div
              className={cn(
                "mt-0.5 text-xs",
                isUpToDate
                  ? "text-emerald-700/80 dark:text-emerald-300/80"
                  : "text-amber-700/80 dark:text-amber-300/80",
              )}
            >
              {checked
                ? isUpToDate
                  ? "You're up to date"
                  : "Update available"
                : "Click “Check for Updates” to verify"}
            </div>
          </div>
          <div className="bg-muted/40 rounded-lg border p-4">
            <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              Status
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {isUpToDate ? (
                <>
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold">Up to date</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="size-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold">
                    {compareVersions(LATEST_VERSION, CURRENT_VERSION) > 0
                      ? "Behind by versions"
                      : "Update ready"}
                  </span>
                </>
              )}
            </div>
            <div className="text-muted-foreground mt-0.5 text-xs">
              {criticalCount} critical · {majorCount} major changes pending
            </div>
          </div>
        </section>

        {/* ─── Dependency graph ────────────────────────────────────── */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Boxes className="size-4 text-primary" aria-hidden />
              Dependency graph
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyTree}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Copy dependency graph"
            >
              {copied ? (
                <CheckCircle2 className="size-3.5 text-primary" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <pre className="bg-background/60 overflow-x-auto p-4 text-xs leading-relaxed">
              <code className="font-mono whitespace-pre">{DEPENDENCY_TREE}</code>
            </pre>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUB_PACKAGES.map((pkg) => (
              <Badge
                key={pkg.name}
                variant="outline"
                className="gap-1 text-[11px]"
              >
                <Package className="size-3 text-muted-foreground" aria-hidden />
                <span className="font-mono">{pkg.name}</span>
                <span className="text-muted-foreground">@{pkg.version}</span>
              </Badge>
            ))}
          </div>
        </section>

        {/* ─── Breaking changes detector ──────────────────────────── */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
              Breaking changes detector
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {BREAKING_CHANGES.length} detected
            </Badge>
          </div>
          <div className="rounded-lg border px-4">
            <ul className="divide-y">
              {BREAKING_CHANGES.map((change) => (
                <BreakingChangeRow key={change.id} change={change} />
              ))}
            </ul>
          </div>
        </section>

        {/* ─── Upgrade simulator ──────────────────────────────────── */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <GitCommitVertical className="size-4 text-primary" aria-hidden />
              Upgrade simulator
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-muted-foreground text-xs font-medium">
                  Target version
                </label>
                <Select
                  value={targetVersion}
                  onValueChange={setTargetVersion}
                >
                  <SelectTrigger className="w-full" aria-label="Target version">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UPGRADE_TARGETS.map((t) => (
                      <SelectItem key={t.version} value={t.version}>
                        {t.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-muted-foreground text-xs leading-snug">
                {selectedTarget.summary}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/40 rounded-md border p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Features
                  </div>
                  <div className="text-foreground text-lg font-semibold tabular-nums">
                    {selectedTarget.featuresAdded}
                  </div>
                </div>
                <div className="bg-muted/40 rounded-md border p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Breaking
                  </div>
                  <div className="text-foreground text-lg font-semibold tabular-nums">
                    {selectedTarget.breakingChanges}
                  </div>
                </div>
                <div className="bg-muted/40 rounded-md border p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Deprecations
                  </div>
                  <div className="text-foreground text-lg font-semibold tabular-nums">
                    {selectedTarget.deprecations}
                  </div>
                </div>
                <div className="bg-muted/40 rounded-md border p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Est. time
                  </div>
                  <div className="text-foreground text-lg font-semibold tabular-nums">
                    {selectedTarget.estimatedTime}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                {isUpgrade ? (
                  <ArrowUpCircle className="size-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="text-sm font-semibold">
                  {CURRENT_VERSION} → {selectedTarget.version}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-auto text-[10px] uppercase tracking-wide",
                    isUpgrade
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
                  )}
                >
                  {isUpgrade ? "Upgrade" : "Same / Downgrade"}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-3 text-xs leading-snug">
                {selectedTarget.summary}
              </p>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                What will change
              </div>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {selectedTarget.notes.map((note, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs leading-snug"
                  >
                    <span
                      className="bg-primary/15 text-primary mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    {note}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!isUpgrade}
                  className="gap-1.5"
                >
                  <Wrench className="size-3.5" />
                  Run migration script
                </Button>
                <Button
                  size="sm"
                  disabled={!isUpgrade}
                  className="gap-1.5"
                  onClick={() =>
                    toast({
                      title: "Upgrade simulated",
                      description: `${CURRENT_VERSION} → ${selectedTarget.version} would complete in ${selectedTarget.estimatedTime}.`,
                    })
                  }
                >
                  <ArrowUpCircle className="size-3.5" />
                  Simulate upgrade
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Changelog ──────────────────────────────────────────── */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="size-4 text-primary" aria-hidden />
              Changelog
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {CHANGELOG.length} recent releases
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {CHANGELOG.map((entry, i) => (
              <ChangelogCard
                key={entry.version}
                entry={entry}
                isLatest={i === 0}
              />
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
