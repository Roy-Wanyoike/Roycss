"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyRegistry — a package registry for RoyCSS.
 *
 * Self-contained (no props). Three sections:
 *   1. Stats header — N packages · M public · K private · Total
 *      downloads: X.
 *   2. Toolbar — search input + type filter chips (All / Components /
 *      Themes / Plugins) + "Publish Package" button.
 *   3. Package list — 10 mock packages with name, version, type badge
 *      (Public / Private / Internal), publisher, download count, last
 *      updated. Clicking a row opens a detail dialog with description,
 *      readme preview, versions list, dependencies, and an install
 *      command (with a Copy button).
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Every type / visibility is a string-
 *     literal union; the `never` guard enforces exhaustiveness on the
 *     visibility-to-color mapper.
 *   • Memoized filtering — the visible list is recomputed only when
 *     search / filter / packages change.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     warnings, rose for criticals, sky for info accents. No indigo
 *     or blue anywhere.
 *   • SSR-safe — no `window` access at module scope.
 */

import * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Boxes,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Package,
  PackageOpen,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Terminal,
  Upload,
  Users,
  type LucideIcon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type PackageType = "components" | "themes" | "plugins";
type TypeFilter = "all" | PackageType;
type Visibility = "public" | "private" | "internal";

interface PackageVersion {
  version: string;
  date: string;
  notes: string;
}

interface RegistryPackage {
  id: string;
  name: string;
  description: string;
  readmePreview: string;
  type: PackageType;
  visibility: Visibility;
  publisher: string;
  version: string;
  downloads: number;
  updatedAt: string;
  dependencies: readonly string[];
  versions: readonly PackageVersion[];
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const PACKAGES: readonly RegistryPackage[] = [
  {
    id: "pkg-1",
    name: "@roycss/kit-forms",
    description:
      "Production form kit — Zod schemas, react-hook-form wiring, and 12 field components.",
    readmePreview:
      "# @roycss/kit-forms\n\nA drop-in form kit for RoyCSS apps. Includes Zod schemas, react-hook-form wiring, and 12 fully-typed field components.\n\n## Install\n```bash\nnpm i @roycss/kit-forms\n```\n\n## Quickstart\n```tsx\nimport { Form, Field, Input } from \"@roycss/kit-forms\";\n```\n\nAll fields ship with built-in ARIA + label/description wiring.",
    type: "components",
    visibility: "public",
    publisher: "roy",
    version: "1.4.2",
    downloads: 184_320,
    updatedAt: "2 days ago",
    dependencies: ["react@^18", "react-hook-form@^7", "zod@^3"],
    versions: [
      { version: "1.4.2", date: "2025-04-10", notes: "Fix date-field timezone bug." },
      { version: "1.4.1", date: "2025-03-22", notes: "Add Switch field." },
      { version: "1.4.0", date: "2025-02-14", notes: "Initial Zod v3 support." },
    ],
  },
  {
    id: "pkg-2",
    name: "@roycss/theme-aurora",
    description:
      "Aurora theme — bright OKLCH palette with optional gradient mesh background.",
    readmePreview:
      "# @roycss/theme-aurora\n\nA bright, high-contrast theme using OKLCH color stops. Pairs well with gradient-mesh backgrounds.\n\n## Install\n```bash\nnpm i @roycss/theme-aurora\n```\n\n## Usage\n```ts\nimport { aurora } from \"@roycss/theme-aurora\";\ntheme.apply(aurora);\n```",
    type: "themes",
    visibility: "public",
    publisher: "aurora-labs",
    version: "0.9.1",
    downloads: 42_180,
    updatedAt: "5 days ago",
    dependencies: ["@roycss/core@^2"],
    versions: [
      { version: "0.9.1", date: "2025-04-07", notes: "Refine dark-mode contrast." },
      { version: "0.9.0", date: "2025-03-01", notes: "Initial public release." },
    ],
  },
  {
    id: "pkg-3",
    name: "@roycss/plugin-tailwind",
    description:
      "Tailwind v4 plugin — emits RoyCSS utility classes from your tokens.",
    readmePreview:
      "# @roycss/plugin-tailwind\n\nA Tailwind v4 plugin that generates RoyCSS utility classes from your design tokens.\n\n## Install\n```bash\nnpm i @roycss/plugin-tailwind\n```\n\n## Usage\n```ts\nimport roycss from \"@roycss/plugin-tailwind\";\nexport default { plugins: [roycss] };\n```",
    type: "plugins",
    visibility: "public",
    publisher: "roycss",
    version: "2.4.0",
    downloads: 256_470,
    updatedAt: "1 day ago",
    dependencies: ["tailwindcss@^4"],
    versions: [
      { version: "2.4.0", date: "2025-04-11", notes: "Tailwind v4 support." },
      { version: "2.3.0", date: "2025-02-20", notes: "OKLCH output." },
      { version: "2.2.0", date: "2025-01-10", notes: "Add `data-effect` utilities." },
    ],
  },
  {
    id: "pkg-4",
    name: "@roycss/kit-tables",
    description:
      "Typed DataTable with sorting, filtering, virtualization, and empty state.",
    readmePreview:
      "# @roycss/kit-tables\n\nA typed, virtualized DataTable with sorting, filtering, and a friendly empty state.\n\n## Install\n```bash\nnpm i @roycss/kit-tables\n```\n\n## Quickstart\n```tsx\nimport { DataTable } from \"@roycss/kit-tables\";\n```",
    type: "components",
    visibility: "public",
    publisher: "roy",
    version: "0.7.4",
    downloads: 98_650,
    updatedAt: "1 week ago",
    dependencies: ["react@^18", "@tanstack/react-virtual@^3"],
    versions: [
      { version: "0.7.4", date: "2025-04-04", notes: "Virtualization perf fix." },
      { version: "0.7.0", date: "2025-03-12", notes: "Add column pinning." },
    ],
  },
  {
    id: "pkg-5",
    name: "@internal/enterprise-tokens",
    description:
      "Internal-only enterprise token set — restricted to RoyCSS org members.",
    readmePreview:
      "# @internal/enterprise-tokens\n\n**Internal — restricted to RoyCSS org members.**\n\nContains the enterprise color and spacing token set used by RoyCSS cloud properties.",
    type: "themes",
    visibility: "internal",
    publisher: "roycss-internal",
    version: "1.0.0",
    downloads: 1_240,
    updatedAt: "3 weeks ago",
    dependencies: ["@roycss/tokens@^2"],
    versions: [
      { version: "1.0.0", date: "2025-03-20", notes: "Initial internal release." },
    ],
  },
  {
    id: "pkg-6",
    name: "@roycss/theme-midnight",
    description:
      "Midnight theme — deep, OLED-friendly dark palette with subtle neon accents.",
    readmePreview:
      "# @roycss/theme-midnight\n\nA deep dark theme optimized for OLED displays, with subtle neon accents.\n\n## Install\n```bash\nnpm i @roycss/theme-midnight\n```",
    type: "themes",
    visibility: "public",
    publisher: "midnight-studio",
    version: "1.2.0",
    downloads: 73_890,
    updatedAt: "4 days ago",
    dependencies: ["@roycss/core@^2"],
    versions: [
      { version: "1.2.0", date: "2025-04-08", notes: "Tune neon accent contrast." },
      { version: "1.1.0", date: "2025-02-28", notes: "Add focus-ring polish." },
      { version: "1.0.0", date: "2025-01-15", notes: "Initial release." },
    ],
  },
  {
    id: "pkg-7",
    name: "@roycss/plugin-vscode",
    description:
      "VS Code extension — class autocomplete, hover docs, and effect snippets.",
    readmePreview:
      "# @roycss/plugin-vscode\n\nThe official VS Code extension. Class autocomplete, hover docs, and effect snippets.\n\n## Install\nSearch \"RoyCSS\" in the VS Code marketplace.",
    type: "plugins",
    visibility: "public",
    publisher: "roycss",
    version: "1.8.2",
    downloads: 312_540,
    updatedAt: "6 days ago",
    dependencies: [],
    versions: [
      { version: "1.8.2", date: "2025-04-06", notes: "Snippets for new effects." },
      { version: "1.8.0", date: "2025-03-10", notes: "Hover-doc improvements." },
    ],
  },
  {
    id: "pkg-8",
    name: "@roycss/kit-charts",
    description:
      "Lightweight chart kit — bar, line, area, and donut built on SVG.",
    readmePreview:
      "# @roycss/kit-charts\n\nA lightweight SVG chart kit: bar, line, area, and donut. Zero runtime dependencies.\n\n## Install\n```bash\nnpm i @roycss/kit-charts\n```",
    type: "components",
    visibility: "public",
    publisher: "charts-co",
    version: "0.4.0",
    downloads: 56_310,
    updatedAt: "2 weeks ago",
    dependencies: ["react@^18"],
    versions: [
      { version: "0.4.0", date: "2025-03-28", notes: "Add donut chart." },
      { version: "0.3.0", date: "2025-02-22", notes: "Add area chart." },
    ],
  },
  {
    id: "pkg-9",
    name: "@my-org/design-system",
    description:
      "Private internal design system — forked from RoyCSS core for our brand.",
    readmePreview:
      "# @my-org/design-system\n\n**Private.** Forked from RoyCSS core, customized for the Acme brand.\n\nInstall via our internal registry:\n```bash\nnpm i @my-org/design-system --registry=https://npm.acme.io\n```",
    type: "components",
    visibility: "private",
    publisher: "acme-design",
    version: "3.1.0",
    downloads: 8_920,
    updatedAt: "1 month ago",
    dependencies: ["@roycss/core@^2", "react@^18"],
    versions: [
      { version: "3.1.0", date: "2025-03-15", notes: "Brand color refresh." },
      { version: "3.0.0", date: "2025-01-20", notes: "Major refactor." },
    ],
  },
  {
    id: "pkg-10",
    name: "@roycss/plugin-mcp",
    description:
      "MCP server plugin — exposes RoyCSS effects, recipes, and patterns to AI agents.",
    readmePreview:
      "# @roycss/plugin-mcp\n\nAn MCP server plugin that exposes RoyCSS effects, recipes, and patterns to AI agents.\n\n## Install\n```bash\nnpm i @roycss/plugin-mcp\n```",
    type: "plugins",
    visibility: "public",
    publisher: "roycss",
    version: "0.2.1",
    downloads: 14_780,
    updatedAt: "3 days ago",
    dependencies: ["@modelcontextprotocol/sdk@^0.4"],
    versions: [
      { version: "0.2.1", date: "2025-04-09", notes: "Add pattern resources." },
      { version: "0.2.0", date: "2025-03-25", notes: "Add recipe tools." },
      { version: "0.1.0", date: "2025-02-10", notes: "Initial release." },
    ],
  },
] as const;

const TYPE_FILTERS: readonly { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "components", label: "Components" },
  { id: "themes", label: "Themes" },
  { id: "plugins", label: "Plugins" },
] as const;

const TYPE_META: Record<
  PackageType,
  { label: string; badge: string; icon: LucideIcon }
> = {
  components: {
    label: "Components",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    icon: PackageOpen,
  },
  themes: {
    label: "Themes",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    icon: Eye,
  },
  plugins: {
    label: "Plugins",
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
    icon: Boxes,
  },
};

const VISIBILITY_META: Record<
  Visibility,
  { label: string; badge: string }
> = {
  public: {
    label: "Public",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  private: {
    label: "Private",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
  },
  internal: {
    label: "Internal",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  },
};

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

/** Format a download count as "1.2k" / "184k" / "1.4M". */
function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const v = n / 1000;
    return v >= 100 ? `${Math.round(v)}k` : `${v.toFixed(1)}k`;
  }
  const v = n / 1_000_000;
  return v >= 100 ? `${Math.round(v)}M` : `${v.toFixed(1)}M`;
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface PackageRowProps {
  pkg: RegistryPackage;
  onOpen: (pkg: RegistryPackage) => void;
}

const PackageRow = React.memo(function PackageRow({
  pkg,
  onOpen,
}: PackageRowProps) {
  const typeMeta = TYPE_META[pkg.type];
  const visMeta = VISIBILITY_META[pkg.visibility];
  const TypeIcon = typeMeta.icon;
  return (
    <button
      type="button"
      onClick={() => onOpen(pkg)}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-all",
        "hover:border-primary/40 hover:bg-accent/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      aria-label={`Open ${pkg.name} details`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md border",
              typeMeta.badge,
            )}
            aria-hidden
          >
            <TypeIcon className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-sm font-semibold">
              {pkg.name}
            </span>
            <span className="text-muted-foreground truncate text-xs leading-snug">
              {pkg.description}
            </span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[10px] uppercase tracking-wide", visMeta.badge)}
        >
          {visMeta.label}
        </Badge>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="inline-flex items-center gap-1">
          <Users className="size-3" aria-hidden />
          {pkg.publisher}
        </span>
        <span className="inline-flex items-center gap-1">
          <Tag className="size-3" aria-hidden />
          <span className="font-mono">v{pkg.version}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Download className="size-3" aria-hidden />
          {formatCount(pkg.downloads)}
        </span>
        <span className="inline-flex items-center gap-1">
          <FileText className="size-3" aria-hidden />
          Updated {pkg.updatedAt}
        </span>
        <Badge
          variant="outline"
          className={cn("ml-auto text-[10px]", typeMeta.badge)}
        >
          {typeMeta.label}
        </Badge>
      </div>
    </button>
  );
});

interface PackageDetailDialogProps {
  pkg: RegistryPackage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopySuccess: (pkg: RegistryPackage) => void;
  onCopyFail: () => void;
}

function PackageDetailDialog({
  pkg,
  open,
  onOpenChange,
  onCopySuccess,
  onCopyFail,
}: PackageDetailDialogProps) {
  const [copied, setCopied] = useState(false);

  // `installCommand` must be stable across renders even when `pkg` is
  // null (early return below) — hooks must run in the same order every
  // render. We compute a sane fallback string and override it inside
  // the callback body.
  const installCommand = pkg ? `npm install ${pkg.name}` : "";

  const handleCopy = useCallback(async () => {
    if (!pkg) return;
    const ok = await copyToClipboard(`npm install ${pkg.name}`);
    if (ok) {
      setCopied(true);
      onCopySuccess(pkg);
    } else {
      onCopyFail();
    }
  }, [pkg, onCopySuccess, onCopyFail]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  if (!pkg) return null;

  const typeMeta = TYPE_META[pkg.type];
  const visMeta = VISIBILITY_META[pkg.visibility];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-md border",
                typeMeta.badge,
              )}
              aria-hidden
            >
              <Package className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <DialogTitle className="font-mono text-base">
                {pkg.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {pkg.description}
              </DialogDescription>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-[10px] uppercase tracking-wide", typeMeta.badge)}
            >
              {typeMeta.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-[10px] uppercase tracking-wide", visMeta.badge)}
            >
              {visMeta.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              v{pkg.version}
            </Badge>
            <span className="text-muted-foreground ml-auto inline-flex items-center gap-1 text-[11px]">
              <Download className="size-3" aria-hidden />
              {formatCount(pkg.downloads)} downloads
            </span>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Install command */}
          <div className="overflow-hidden rounded-md border">
            <div className="bg-muted/50 flex items-center justify-between border-b px-3 py-1.5">
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] font-medium">
                <Terminal className="size-3" aria-hidden />
                Install
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Copy install command"
              >
                {copied ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
            <pre className="bg-background/60 overflow-x-auto p-3 text-xs leading-relaxed">
              <code className="font-mono whitespace-pre">{installCommand}</code>
            </pre>
          </div>

          {/* Readme preview */}
          <div>
            <h4 className="text-muted-foreground mb-1.5 text-[11px] font-medium uppercase tracking-wide">
              Readme preview
            </h4>
            <pre className="bg-muted/40 max-h-48 overflow-auto rounded-md border p-3 text-xs leading-relaxed">
              <code className="font-mono whitespace-pre-wrap">
                {pkg.readmePreview}
              </code>
            </pre>
          </div>

          {/* Versions + dependencies */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <h4 className="text-muted-foreground mb-1.5 text-[11px] font-medium uppercase tracking-wide">
                Versions
              </h4>
              <ul className="flex flex-col gap-1.5">
                {pkg.versions.map((v) => (
                  <li
                    key={v.version}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-mono">v{v.version}</span>
                    <span className="text-muted-foreground text-[11px]">
                      {v.date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-muted-foreground mb-1.5 text-[11px] font-medium uppercase tracking-wide">
                Dependencies
              </h4>
              {pkg.dependencies.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No runtime dependencies.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {pkg.dependencies.map((dep) => (
                    <li key={dep}>
                      <code className="bg-muted/60 rounded px-1.5 py-0.5 font-mono text-[11px]">
                        {dep}
                      </code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="sm"
          >
            Close
          </Button>
          <Button onClick={handleCopy} size="sm" className="gap-1.5">
            {copied ? (
              <>
                <Check className="size-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy install command
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (pkg: RegistryPackage) => void;
}

function PublishDialog({ open, onOpenChange, onPublish }: PublishDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PackageType>("components");
  const [visibility, setVisibility] = useState<Visibility>("public");

  const reset = useCallback(() => {
    setName("");
    setDescription("");
    setType("components");
    setVisibility("public");
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim() || "@my-org/untitled";
    const pkg: RegistryPackage = {
      id: `pkg-${Date.now()}`,
      name: trimmedName,
      description: description.trim() || "No description provided.",
      readmePreview: `# ${trimmedName}\n\nNo readme yet.`,
      type,
      visibility,
      publisher: "you",
      version: "0.1.0",
      downloads: 0,
      updatedAt: "Just now",
      dependencies: [],
      versions: [
        { version: "0.1.0", date: new Date().toISOString().slice(0, 10), notes: "Initial publish." },
      ],
    };
    onPublish(pkg);
    reset();
    onOpenChange(false);
  }, [name, description, type, visibility, onPublish, reset, onOpenChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-primary" aria-hidden />
            Publish a package
          </DialogTitle>
          <DialogDescription>
            Publish a new package to the RoyCSS registry. All fields below
            are required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pub-name" className="text-xs">
              Package name
            </Label>
            <Input
              id="pub-name"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              placeholder="@my-org/my-package"
              className="font-mono text-sm"
              aria-label="Package name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pub-desc" className="text-xs">
              Description
            </Label>
            <Textarea
              id="pub-desc"
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="What does this package do?"
              rows={3}
              aria-label="Description"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as PackageType)}>
                <SelectTrigger className="w-full" aria-label="Package type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="components">Components</SelectItem>
                  <SelectItem value="themes">Themes</SelectItem>
                  <SelectItem value="plugins">Plugins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as Visibility)}
              >
                <SelectTrigger className="w-full" aria-label="Visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} size="sm" className="gap-1.5">
            <Upload className="size-3.5" />
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyRegistry
// ═══════════════════════════════════════════════════════════════════════

export function RoyRegistry() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("registry/packages");
  void data;

  const { toast } = useToast();
  const [packages, setPackages] = useState<readonly RegistryPackage[]>(PACKAGES);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [active, setActive] = useState<RegistryPackage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  // ─── Memoized stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = packages.length;
    const pub = packages.filter((p) => p.visibility === "public").length;
    const priv = packages.filter((p) => p.visibility === "private").length;
    const downloads = packages.reduce((sum, p) => sum + p.downloads, 0);
    return { total, pub, priv, downloads };
  }, [packages]);

  // ─── Memoized filter pipeline ────────────────────────────────────
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (q.length === 0) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.publisher.toLowerCase().includes(q)
      );
    });
  }, [packages, search, typeFilter]);

  // ─── Handlers ────────────────────────────────────────────────────
  const handleOpen = useCallback((pkg: RegistryPackage) => {
    setActive(pkg);
    setDetailOpen(true);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      // Defer clearing so the close animation runs against the right data.
      const t = setTimeout(() => setActive(null), 200);
      // Best-effort cleanup; this dialog is short-lived.
      setTimeout(() => clearTimeout(t), 400);
    }
  }, []);

  const handlePublish = useCallback(
    (pkg: RegistryPackage) => {
      setPackages((prev) => [pkg, ...prev]);
      toast({
        title: "Package published",
        description: `${pkg.name} v${pkg.version} is now in the registry.`,
      });
    },
    [toast],
  );

  const handleCopySuccess = useCallback(
    (pkg: RegistryPackage) => {
      toast({
        title: "Install command copied",
        description: `npm install ${pkg.name}`,
      });
    },
    [toast],
  );

  const handleCopyFail = useCallback(() => {
    toast({
      title: "Copy failed",
      description: "Clipboard is unavailable in this context.",
      variant: "destructive",
    });
  }, [toast]);

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
  }, []);

  const hasFilters = search.trim().length > 0 || typeFilter !== "all";

  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Package className="size-5 text-primary" aria-hidden />
          Roy Registry
        </CardTitle>
        <CardDescription>
          {stats.total} packages · {stats.pub} public · {stats.priv} private ·
          Total downloads: {formatCount(stats.downloads)}
        </CardDescription>
        <CardAction>
          <BackendLiveBadge loading={loading} error={error} />
          <Button
            size="sm"
            onClick={() => setPublishOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Publish Package
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {/* ─── Toolbar: search + filter chips ──────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, description, or publisher…"
                className="pl-9"
                aria-label="Search packages"
              />
              {search.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  aria-label="Clear search"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
          </div>

          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter by type"
          >
            {TYPE_FILTERS.map((tf) => {
              const isActive = typeFilter === tf.id;
              const meta =
                tf.id === "all"
                  ? null
                  : TYPE_META[tf.id as PackageType];
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTypeFilter(tf.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? meta
                        ? meta.badge
                        : "border-foreground/30 bg-foreground/10 text-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Package list ────────────────────────────────────────── */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {visible.map((pkg) => (
              <PackageRow key={pkg.id} pkg={pkg} onOpen={handleOpen} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">No packages found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or type filter.
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                <RotateCcw className="size-3.5" aria-hidden />
                Reset filters
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <PackageDetailDialog
        pkg={active}
        open={detailOpen}
        onOpenChange={handleClose}
        onCopySuccess={handleCopySuccess}
        onCopyFail={handleCopyFail}
      />
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onPublish={handlePublish}
      />
    </Card>
  );
}
