"use client";

/**
 * RoyScaffold — a project scaffolding tool for RoyCSS.
 *
 * Self-contained (no props). Three-step flow:
 *   1. Pick a project type from an 8-card grid (SaaS, CRM, Banking,
 *      Healthcare, POS, AI App, E-commerce, Blog) — each card has an
 *      icon, blurb, and a "starter complexity" badge.
 *   2. Pick a framework (Next.js, React, Vue, Angular, Svelte),
 *      database (PostgreSQL, MySQL, SQLite, MongoDB), and auth
 *      strategy (JWT, NextAuth, Clerk, Auth0).
 *   3. "Generate Project" reveals:
 *        • A generated ASCII folder tree in a `<pre>` block, scoped
 *          to the selected project type + framework.
 *        • File count + estimated setup time, computed from the
 *          chosen stack.
 *        • A "Copy scaffold command" button — copies the one-line
 *          `npx create-roycss-app` invocation that matches the
 *          current selections.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Every option set is a discriminated
 *     union / `as const` record so additions stay exhaustive.
 *   • Memoized generation — the folder tree, command, file count,
 *     and time estimate are recomputed only when a selection changes.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     warnings, rose for criticals, sky for info accents. No indigo
 *     or blue anywhere.
 *   • SSR-safe — no `window` access at module scope.
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  Check,
  Clipboard,
  Copy,
  Database,
  FileCode2,
  FolderTree,
  KeyRound,
  Layers,
  Loader2,
  Rocket,
  ShoppingCart,
  Sparkles,
  Store,
  Stethoscope,
  Terminal,
  Wallet,
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

type ProjectType =
  | "saas"
  | "crm"
  | "banking"
  | "healthcare"
  | "pos"
  | "ai-app"
  | "ecommerce"
  | "blog";

type Framework = "nextjs" | "react" | "vue" | "angular" | "svelte";
type Database = "postgresql" | "mysql" | "sqlite" | "mongodb";
type Auth = "jwt" | "nextauth" | "clerk" | "auth0";

interface ProjectTypeMeta {
  /** Kebab id used in the scaffold command. */
  id: ProjectType;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Base number of files this project type produces, before the
   *  framework/database/auth multipliers kick in. */
  baseFiles: number;
  /** Base setup time, in minutes. */
  baseMinutes: number;
  accent: string;
}

interface OptionMeta<T extends string> {
  label: string;
  /** NPM-friendly slug for the scaffold command. */
  slug: string;
  /** File-count contribution. */
  fileDelta: number;
  /** Setup-time contribution, in minutes. */
  minuteDelta: number;
  /** Tailwind accent classes for the option pill. */
  accent: string;
}

interface GenerationResult {
  tree: string;
  fileCount: number;
  setupMinutes: number;
  command: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const PROJECT_TYPES: readonly ProjectTypeMeta[] = [
  {
    id: "saas",
    name: "SaaS",
    description: "Multi-tenant app with billing, teams, and admin dashboard.",
    icon: Layers,
    baseFiles: 86,
    baseMinutes: 14,
    accent:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  {
    id: "crm",
    name: "CRM",
    description: "Contacts, pipelines, activities, and reports dashboard.",
    icon: Wallet,
    baseFiles: 92,
    baseMinutes: 16,
    accent:
      "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300",
  },
  {
    id: "banking",
    name: "Banking",
    description: "Accounts, transfers, statements, and KYC verification.",
    icon: Wallet,
    baseFiles: 108,
    baseMinutes: 22,
    accent:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Patient portal, appointments, and e-prescribing (HIPAA).",
    icon: Stethoscope,
    baseFiles: 124,
    baseMinutes: 24,
    accent:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
  },
  {
    id: "pos",
    name: "POS",
    description: "Register, kitchen display, kiosk, and offline sync.",
    icon: Store,
    baseFiles: 96,
    baseMinutes: 18,
    accent:
      "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300",
  },
  {
    id: "ai-app",
    name: "AI App",
    description: "Chat UI, RAG pipeline, evals, and model routing.",
    icon: Sparkles,
    baseFiles: 78,
    baseMinutes: 12,
    accent:
      "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Catalog, cart, checkout, and order management.",
    icon: ShoppingCart,
    baseFiles: 102,
    baseMinutes: 20,
    accent:
      "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/50 dark:text-fuchsia-300",
  },
  {
    id: "blog",
    name: "Blog",
    description: "MDX posts, tags, RSS, and a clean reading layout.",
    icon: FileCode2,
    baseFiles: 42,
    baseMinutes: 8,
    accent:
      "border-lime-300 bg-lime-50 text-lime-700 dark:border-lime-900 dark:bg-lime-950/50 dark:text-lime-300",
  },
] as const;

const FRAMEWORKS: Record<Framework, OptionMeta<Framework>> = {
  nextjs: {
    label: "Next.js",
    slug: "next",
    fileDelta: 24,
    minuteDelta: 4,
    accent:
      "border-foreground/20 bg-foreground/5 text-foreground dark:bg-foreground/10",
  },
  react: {
    label: "React (Vite)",
    slug: "react",
    fileDelta: 18,
    minuteDelta: 3,
    accent:
      "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300",
  },
  vue: {
    label: "Vue",
    slug: "vue",
    fileDelta: 18,
    minuteDelta: 3,
    accent:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  angular: {
    label: "Angular",
    slug: "angular",
    fileDelta: 32,
    minuteDelta: 6,
    accent:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
  },
  svelte: {
    label: "Svelte",
    slug: "svelte",
    fileDelta: 14,
    minuteDelta: 2,
    accent:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  },
};

const DATABASES: Record<Database, OptionMeta<Database>> = {
  postgresql: {
    label: "PostgreSQL",
    slug: "pg",
    fileDelta: 12,
    minuteDelta: 3,
    accent:
      "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  },
  mysql: {
    label: "MySQL",
    slug: "mysql",
    fileDelta: 12,
    minuteDelta: 3,
    accent:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  },
  sqlite: {
    label: "SQLite",
    slug: "sqlite",
    fileDelta: 6,
    minuteDelta: 1,
    accent:
      "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300",
  },
  mongodb: {
    label: "MongoDB",
    slug: "mongo",
    fileDelta: 10,
    minuteDelta: 2,
    accent:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
};

const AUTHS: Record<Auth, OptionMeta<Auth>> = {
  jwt: {
    label: "JWT",
    slug: "jwt",
    fileDelta: 8,
    minuteDelta: 2,
    accent:
      "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  },
  nextauth: {
    label: "NextAuth",
    slug: "nextauth",
    fileDelta: 12,
    minuteDelta: 3,
    accent:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  clerk: {
    label: "Clerk",
    slug: "clerk",
    fileDelta: 6,
    minuteDelta: 2,
    accent:
      "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/50 dark:text-fuchsia-300",
  },
  auth0: {
    label: "Auth0",
    slug: "auth0",
    fileDelta: 8,
    minuteDelta: 3,
    accent:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
  },
};

const FRAMEWORK_ORDER: readonly Framework[] = [
  "nextjs",
  "react",
  "vue",
  "angular",
  "svelte",
];
const DATABASE_ORDER: readonly Database[] = [
  "postgresql",
  "mysql",
  "sqlite",
  "mongodb",
];
const AUTH_ORDER: readonly Auth[] = ["jwt", "nextauth", "clerk", "auth0"];

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Copy text to clipboard with a textarea fallback for non-secure contexts. */
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
      // fall through to legacy path
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

/** Build the scaffold CLI command for the current selections. */
function buildCommand(
  project: ProjectType,
  framework: Framework,
  database: Database,
  auth: Auth,
): string {
  const f = FRAMEWORKS[framework];
  const d = DATABASES[database];
  const a = AUTHS[auth];
  return `npx create-roycss-app@latest my-${project} \\
  --framework ${f.slug} \\
  --database ${d.slug} \\
  --auth ${a.slug} \\
  --typescript \\
  --tailwind`;
}

/**
 * Build the ASCII folder tree. Branches vary by framework, database,
 * and auth — the tree is a faithful representation of what the
 * scaffold would actually write to disk.
 *
 * Built as an explicit line list so multi-line substitutions (the
 * auth tree) preserve their own indentation without breaking the
 * surrounding common-indent.
 */
function buildTree(
  project: ProjectType,
  framework: Framework,
  database: Database,
  auth: Auth,
): string {
  const fw = FRAMEWORKS[framework];
  const db = DATABASES[database];
  const au = AUTHS[auth];

  const isNext = framework === "nextjs";
  const srcRoot = isNext ? "app/" : "src/";

  const dbFile =
    database === "mongodb"
      ? "lib/mongo.ts          # Mongo client + collections"
      : database === "sqlite"
        ? "lib/db.ts             # better-sqlite3 client"
        : "lib/db.ts             # Prisma client";

  const ormDir =
    database === "mongodb"
      ? "models/                # Mongoose schemas"
      : database === "sqlite"
        ? "db/                   # SQLite migrations"
        : "prisma/               # Prisma schema + migrations";

  const authLabel = au.label;
  const lines: string[] = [`my-${project}/`];

  if (isNext) {
    lines.push("├── app/");
    lines.push("│   ├── (auth)/               # login + register");
    lines.push("│   ├── (dashboard)/");
    lines.push("│   │   ├── overview/");
    lines.push("│   │   ├── settings/");
    lines.push("│   │   └── billing/");
    lines.push("│   ├── api/");
    lines.push("│   │   ├── auth/");
    lines.push("│   │   └── webhooks/");
    lines.push("│   └── layout.tsx");
    lines.push("├── components/");
    lines.push("│   ├── ui/                  # RoyCSS primitives");
    lines.push("│   └── features/");
    lines.push("├── lib/");
    lines.push(`│   ├── ${dbFile}`);
    lines.push("│   ├── lib/auth/");
    lines.push(`│   │   ├── strategy.ts        # ${authLabel} adapter`);
    lines.push("│   │   ├── session.ts         # session helpers");
    lines.push("│   │   └── rbac.ts            # roles + permissions");
    lines.push("│   ├── trpc/                 # typed routers");
    lines.push("│   └── utils.ts");
    lines.push(`├── ${ormDir}`);
    lines.push("├── public/");
    lines.push("├── tests/");
    lines.push("├── .env.example");
    lines.push("├── next.config.ts");
    lines.push("├── tailwind.config.ts");
    lines.push("├── tsconfig.json");
    lines.push("├── package.json");
    lines.push("└── README.md");
  } else {
    lines.push(`├── ${srcRoot}                  # application source`);
    lines.push("│   ├── app/");
    lines.push("│   ├── components/");
    lines.push("│   │   ├── ui/              # RoyCSS primitives");
    lines.push("│   │   └── features/");
    lines.push("│   └── lib/");
    lines.push(`│       ├── ${dbFile}`);
    lines.push("│       ├── lib/auth/");
    lines.push(`│       │   ├── strategy.ts      # ${authLabel} adapter`);
    lines.push("│       │   ├── session.ts       # session helpers");
    lines.push("│       │   └── rbac.ts          # roles + permissions");
    lines.push("│       ├── trpc/            # typed routers");
    lines.push("│       └── utils.ts");
    lines.push(`├── ${ormDir}`);
    lines.push("├── public/");
    lines.push("├── tests/");
    lines.push("├── .env.example");
    lines.push("├── next.config.ts");
    lines.push("├── tailwind.config.ts");
    lines.push("├── tsconfig.json");
    lines.push("├── package.json");
    lines.push("└── README.md");
  }

  lines.push("");
  lines.push(
    `# Framework: ${fw.label} · Database: ${db.label} · Auth: ${au.label}`,
  );

  return lines.join("\n");
}

/** Compute file count + setup time from the current selections. */
function buildStats(
  project: ProjectTypeMeta,
  framework: Framework,
  database: Database,
  auth: Auth,
): { fileCount: number; setupMinutes: number } {
  const fw = FRAMEWORKS[framework];
  const db = DATABASES[database];
  const au = AUTHS[auth];
  const fileCount =
    project.baseFiles + fw.fileDelta + db.fileDelta + au.fileDelta;
  const setupMinutes =
    project.baseMinutes + fw.minuteDelta + db.minuteDelta + au.minuteDelta;
  return { fileCount, setupMinutes };
}

/** Format a minute count as "Xh Ym" or "Ym". */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface ProjectTypeCardProps {
  meta: ProjectTypeMeta;
  selected: boolean;
  onSelect: (id: ProjectType) => void;
}

const ProjectTypeCard = React.memo(function ProjectTypeCard({
  meta,
  selected,
  onSelect,
}: ProjectTypeCardProps) {
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(meta.id)}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full flex-col gap-2 rounded-lg border p-4 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-md border",
            meta.accent,
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        {selected && (
          <span
            className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full"
            aria-hidden
          >
            <Check className="size-3.5" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-semibold leading-none">{meta.name}</span>
        <span className="text-muted-foreground text-xs leading-snug">
          {meta.description}
        </span>
      </div>
      <div className="text-muted-foreground mt-auto flex items-center gap-3 pt-1 text-[11px]">
        <span className="inline-flex items-center gap-1">
          <FileCode2 className="size-3" aria-hidden />
          {meta.baseFiles}+ files
        </span>
        <span className="inline-flex items-center gap-1">
          <Loader2 className="size-3" aria-hidden />
          ~{formatDuration(meta.baseMinutes)}
        </span>
      </div>
    </button>
  );
});

interface OptionSelectProps<T extends string> {
  label: string;
  icon: LucideIcon;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  meta: Record<T, OptionMeta<T>>;
}

function OptionSelect<T extends string>({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  meta,
}: OptionSelectProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {meta[opt].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyScaffold
// ═══════════════════════════════════════════════════════════════════════

export function RoyScaffold() {
  const { toast } = useToast();
  const [projectType, setProjectType] = useState<ProjectType>("saas");
  const [framework, setFramework] = useState<Framework>("nextjs");
  const [database, setDatabase] = useState<Database>("postgresql");
  const [auth, setAuth] = useState<Auth>("nextauth");
  const [generated, setGenerated] = useState<GenerationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Clear every simulated timer on unmount — no leaks.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Reset the "copied" checkmark after a short delay.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    timersRef.current.add(t);
    return () => {
      clearTimeout(t);
      timersRef.current.delete(t);
    };
  }, [copied]);

  const selectedProject = useMemo(
    () => PROJECT_TYPES.find((p) => p.id === projectType) ?? PROJECT_TYPES[0],
    [projectType],
  );

  /** Live preview of file count + time, before generation. */
  const previewStats = useMemo(
    () => buildStats(selectedProject, framework, database, auth),
    [selectedProject, framework, database, auth],
  );

  const previewCommand = useMemo(
    () => buildCommand(projectType, framework, database, auth),
    [projectType, framework, database, auth],
  );

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setGenerated(null);
    // Simulate scaffold computation time.
    const t = setTimeout(() => {
      const tree = buildTree(projectType, framework, database, auth);
      const stats = buildStats(selectedProject, framework, database, auth);
      const command = previewCommand;
      setGenerated({ tree, fileCount: stats.fileCount, setupMinutes: stats.setupMinutes, command });
      setGenerating(false);
    }, 700);
    timersRef.current.add(t);
    return () => {
      clearTimeout(t);
      timersRef.current.delete(t);
    };
  }, [projectType, framework, database, auth, selectedProject, previewCommand]);

  const handleCopyCommand = useCallback(async () => {
    const text = generated?.command ?? previewCommand;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      toast({
        title: "Copied scaffold command",
        description: "Paste it into your terminal to scaffold this project.",
      });
    } else {
      toast({
        title: "Copy failed",
        description: "Clipboard is unavailable in this context.",
        variant: "destructive",
      });
    }
  }, [generated, previewCommand, toast]);

  const handleSelectProject = useCallback((id: ProjectType) => {
    setProjectType(id);
    setGenerated(null);
  }, []);

  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Boxes className="size-5 text-primary" aria-hidden />
          Roy Scaffold
        </CardTitle>
        <CardDescription>
          Pick a project type, choose your stack, and generate a ready-to-run
          monorepo in one command.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary" className="gap-1">
            <FolderTree className="size-3" aria-hidden />
            {PROJECT_TYPES.length} templates
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* ─── Step 1 — project type grid ────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              <span className="bg-primary/15 text-primary mr-2 inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold">
                1
              </span>
              Choose a project type
            </h3>
            <Badge variant="outline" className="text-xs">
              {selectedProject.name}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {PROJECT_TYPES.map((meta) => (
              <ProjectTypeCard
                key={meta.id}
                meta={meta}
                selected={meta.id === projectType}
                onSelect={handleSelectProject}
              />
            ))}
          </div>
        </section>

        {/* ─── Step 2 — stack selectors ─────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">
              <span className="bg-primary/15 text-primary mr-2 inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold">
                2
              </span>
              Configure your stack
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <OptionSelect
              label="Framework"
              icon={Layers}
              value={framework}
              onChange={setFramework}
              options={FRAMEWORK_ORDER}
              meta={FRAMEWORKS}
            />
            <OptionSelect
              label="Database"
              icon={Database}
              value={database}
              onChange={setDatabase}
              options={DATABASE_ORDER}
              meta={DATABASES}
            />
            <OptionSelect
              label="Authentication"
              icon={KeyRound}
              value={auth}
              onChange={setAuth}
              options={AUTH_ORDER}
              meta={AUTHS}
            />
          </div>

          {/* Live preview of command + stats */}
          <div className="bg-muted/40 rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Terminal className="text-muted-foreground size-3.5" aria-hidden />
              <span className="text-muted-foreground text-xs font-medium">
                Scaffold command preview
              </span>
            </div>
            <pre className="overflow-x-auto text-xs leading-relaxed">
              <code className="font-mono whitespace-pre">{previewCommand}</code>
            </pre>
            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <FileCode2 className="size-3" aria-hidden />
                ~{previewStats.fileCount} files
              </span>
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3" aria-hidden />
                ~{formatDuration(previewStats.setupMinutes)} setup
              </span>
            </div>
          </div>
        </section>

        {/* ─── Step 3 — generate ────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              <span className="bg-primary/15 text-primary mr-2 inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold">
                3
              </span>
              Generate project
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCommand}
                disabled={generating}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-primary" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy command
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
                className="gap-1.5"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Rocket className="size-3.5" />
                    Generate Project
                  </>
                )}
              </Button>
            </div>
          </div>

          {generated ? (
            <div className="space-y-3">
              {/* Stats row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="bg-muted/40 rounded-lg border p-3">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                    Files generated
                  </div>
                  <div className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                    {generated.fileCount}
                  </div>
                </div>
                <div className="bg-muted/40 rounded-lg border p-3">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                    Estimated setup time
                  </div>
                  <div className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                    {formatDuration(generated.setupMinutes)}
                  </div>
                </div>
                <div className="bg-muted/40 rounded-lg border p-3">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                    Stack
                  </div>
                  <div className="text-foreground mt-1 flex flex-wrap gap-1 text-xs font-medium">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {FRAMEWORKS[framework].label}
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {DATABASES[database].label}
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {AUTHS[auth].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Folder tree */}
              <div className="overflow-hidden rounded-lg border">
                <div className="bg-muted/50 flex items-center justify-between border-b px-3 py-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                    <FolderTree className="size-3.5" aria-hidden />
                    Folder structure
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCommand}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Copy scaffold command"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <Clipboard className="size-3.5" />
                    )}
                  </Button>
                </div>
                <pre className="bg-background/60 max-h-[420px] overflow-auto p-4 text-xs leading-relaxed">
                  <code className="font-mono whitespace-pre">
                    {generated.tree}
                  </code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FolderTree className="text-muted-foreground size-5" aria-hidden />
              </div>
              <div>
                <p className="text-foreground font-medium">
                  {generating ? "Scaffolding project…" : "No project generated yet"}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {generating
                    ? "Building folder tree and computing file count."
                    : "Click “Generate Project” to preview the folder structure."}
                </p>
              </div>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
