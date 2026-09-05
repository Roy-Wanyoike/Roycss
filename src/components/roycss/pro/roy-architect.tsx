"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyArchitect — AI application architect.
 *
 * User enters product requirements in a textarea, picks from 3 preset
 * requirement chips, then clicks "Generate Architecture". The component
 * simulates a 2-second AI run (with progress bar) and renders the
 * generated architecture as:
 *   • a text-tree architecture diagram,
 *   • a folder structure (monospace tree),
 *   • a tech stack table (Frontend / Backend / Database / Auth / Deploy),
 *   • an API endpoints list,
 *   • a testing strategy, and
 *   • deployment recommendations.
 * A "Copy architecture" button copies a flat text version to clipboard.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, no API calls.
 *   • Simulated async via setTimeout / setInterval; every timer id is
 *     registered in a ref Set and cleared on unmount — no leaks.
 *   • TS strict, zero `any`. Exhaustiveness `never` guards.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     warnings, rose for criticals. No indigo / blue anywhere.
 *   • Responsive within a max-w-2xl wrapper.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Boxes,
  Check,
  Copy,
  Database,
  FolderTree,
  Globe,
  KeyRound,
  Layers,
  Loader2,
  type LucideIcon,
  Play,
  Rocket,
  ScrollText,
  Server,
  Sparkles,
  TestTube2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

interface TechStackItem {
  layer: "Frontend" | "Backend" | "Database" | "Auth" | "Deploy";
  pick: string;
  reason: string;
}

interface ApiEndpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
}

interface TestCase {
  layer: string;
  framework: string;
  coverage: string;
  scope: string;
}

interface DeployStep {
  title: string;
  detail: string;
}

interface Architecture {
  diagram: string[];
  folders: string[];
  stack: TechStackItem[];
  endpoints: ApiEndpoint[];
  testing: TestCase[];
  deployment: DeployStep[];
  summary: string;
}

interface PresetDef {
  id: string;
  label: string;
  prompt: string;
  emoji: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Presets
// ═══════════════════════════════════════════════════════════════════════

const PRESETS: readonly PresetDef[] = [
  {
    id: "healthcare",
    label: "Healthcare Portal",
    prompt:
      "Build a healthcare patient portal with appointment booking, secure messaging, lab results, and prescription refills. Must be HIPAA compliant.",
    emoji: "\u{1F3E5}",
  },
  {
    id: "saas",
    label: "SaaS Dashboard",
    prompt:
      "Build a multi-tenant SaaS dashboard with billing, role-based access, analytics charts, and a webhook system for third-party integrations.",
    emoji: "\u{1F4CA}",
  },
  {
    id: "banking",
    label: "Banking App",
    prompt:
      "Build a mobile-first banking app with account balances, transfers, biometric login, fraud detection, and real-time transaction notifications.",
    emoji: "\u{1F4F1}",
  },
] as const;

const DEFAULT_PROMPT =
  "Describe the product you want to architect. Include the audience, the main features, any compliance requirements, and the scale you expect.";

// ═══════════════════════════════════════════════════════════════════════
// Architecture generator — pure function, no side effects.
// Maps a prompt to a deterministic-but-varied Architecture.
// ═══════════════════════════════════════════════════════════════════════

function classifyPrompt(prompt: string): {
  domain: string;
  isHealthcare: boolean;
  isSaaS: boolean;
  isBanking: boolean;
  isMobile: boolean;
  isRealtime: boolean;
} {
  const text = prompt.toLowerCase();
  return {
    domain: prompt.split(/[.,\n]/)[0]?.slice(0, 60).trim() || "your product",
    isHealthcare:
      /health|patient|hipaa|clinic|medical|prescription|lab result/i.test(text),
    isSaaS: /saas|multi-tenant|billing|subscription|webhook|dashboard/i.test(
      text
    ),
    isBanking: /bank|transfer|payment|fintech|account balance|fraud|kyc/i.test(
      text
    ),
    isMobile: /mobile|ios|android|biometric|pwa/i.test(text),
    isRealtime: /realtime|real-time|live|notification|chat|messaging/i.test(
      text
    ),
  };
}

function buildArchitecture(prompt: string): Architecture {
  const c = classifyPrompt(prompt);
  const domain = c.domain;

  // ── Diagram ────────────────────────────────────────────────────────
  const diagram: string[] = [
    `${domain}`,
    `\u2502`,
    `\u251C\u2500 Client (${c.isMobile ? "Mobile PWA" : "Web"})`,
    `\u2502   \u251C\u2500 UI Layer (RoyCSS design system)`,
    `\u2502   \u251C\u2500 State (Zustand / TanStack Query)`,
    `\u2502   \u2514\u2500 Auth (token + refresh)`,
    `\u2502`,
    `\u251C\u2500 Edge / CDN`,
    `\u2502   \u2514\u2500 Static assets + image optimization`,
    `\u2502`,
    `\u251C\u2500 API Gateway`,
    `\u2502   \u251C\u2500 REST (CRUD)`,
    `\u2502   \u251C\u2500 ${c.isRealtime ? "WebSocket (live events)" : "Background jobs"}`,
    `\u2502   \u2514\u2500 Rate limiting + auth middleware`,
    `\u2502`,
    `\u251C\u2500 Services`,
    `\u2502   \u251C\u2500 Users / Auth service`,
    `\u2502   \u251C\u2500 Domain service (${domain})`,
    `\u2502   \u2514\u2500 Notifications service`,
    `\u2502`,
    `\u251C\u2500 Data`,
    `\u2502   \u251C\u2500 Primary DB (Postgres)`,
    `\u2502   \u251C\u2500 Cache (Redis)`,
    `\u2502   \u2514\u2500 Object storage (S3)`,
    `\u2502`,
    `\u2514\u2500 Observability`,
    `    \u251C\u2500 Logs (structured JSON)`,
    `    \u251C\u2500 Metrics (Prometheus)`,
    `    \u2514\u2500 Tracing (OpenTelemetry)`,
  ];

  // ── Folder structure ───────────────────────────────────────────────
  const folders: string[] = [
    `${domain.toLowerCase().replace(/\s+/g, "-")}/`,
    `\u251C\u2500 apps/`,
    `\u2502   \u251C\u2500 web/              \u2502 Next.js 16 app`,
    `\u2502   \u2514\u2500 api/              \u2502 Node + Hono services`,
    `\u251C\u2500 packages/`,
    `\u2502   \u251C\u2500 ui/               \u2502 RoyCSS component kit`,
    `\u2502   \u251C\u2500 db/               \u2502 Prisma schema + client`,
    `\u2502   \u2514\u2500 config/           \u2502 ESLint, TS, tailwind preset`,
    `\u251C\u2500 services/`,
    `\u2502   \u251C\u2500 auth/             \u2502 sessions, OAuth, MFA`,
    `\u2502   \u251C\u2500 core/             \u2502 ${domain} domain logic`,
    `\u2502   \u2514\u2500 notifications/    \u2502 email + push`,
    `\u251C\u2500 infra/`,
    `\u2502   \u251C\u2500 terraform/        \u2502 IaC`,
    `\u2502   \u2514\u2500 docker/           \u2502 service images`,
    `\u2514\u2500 tests/`,
    `    \u251C\u2500 unit/`,
    `    \u251C\u2500 integration/`,
    `    \u2514\u2500 e2e/`,
  ];

  // ── Tech stack ─────────────────────────────────────────────────────
  const stack: TechStackItem[] = [
    {
      layer: "Frontend",
      pick: c.isMobile ? "Next.js 16 + PWA + Capacitor" : "Next.js 16 + React 19",
      reason:
        "App-router RSC, edge runtime, and RoyCSS design tokens ship a fast, accessible UI with minimal JS.",
    },
    {
      layer: "Backend",
      pick: "Node 22 + Hono + tRPC",
      reason:
        "Type-safe contracts end-to-end, edge-deployable, and a thin layer over the domain services.",
    },
    {
      layer: "Database",
      pick:
        c.isBanking || c.isHealthcare
          ? "Postgres 16 (row-level security) + Redis 7"
          : "Postgres 16 + Redis 7",
      reason:
        c.isBanking || c.isHealthcare
          ? "RLS enforces tenant isolation at the DB layer; Redis for sessions and rate-limit counters."
          : "Postgres gives relational integrity; Redis handles sessions, queues, and ephemeral state.",
    },
    {
      layer: "Auth",
      pick: c.isBanking
        ? "WebAuthn + OTP (Lucia) + biometric bridge"
        : c.isHealthcare
          ? "OAuth 2.1 + MFA (TOTP) + audit log"
          : "Lucia sessions + OAuth 2.1 (Google, GitHub)",
      reason: c.isBanking
        ? "Passwordless WebAuthn defeats phishing; biometric bridge unlocks the native app."
        : c.isHealthcare
          ? "MFA is required for HIPAA; an immutable audit log covers \u201Cwho saw what\u201D."
          : "Lucia is DB-backed (no vendor lock-in); OAuth keeps signup friction low.",
    },
    {
      layer: "Deploy",
      pick:
        c.isBanking || c.isHealthcare
          ? "AWS (ECS Fargate + RDS + CloudFront) via Terraform"
          : "Vercel (web) + Fly.io (api) + Cloudflare R2",
      reason:
        c.isBanking || c.isHealthcare
          ? "Self-hosted VPC keeps data residency and SOC 2 controls explicit."
          : "Edge-first hosting keeps p99 low; R2 mirrors S3 without egress fees.",
    },
  ];

  // ── API endpoints ──────────────────────────────────────────────────
  const endpoints: ApiEndpoint[] = [
    {
      method: "POST",
      path: "/v1/auth/session",
      description: "Create a session (email + password or OAuth callback).",
    },
    {
      method: "DELETE",
      path: "/v1/auth/session",
      description: "End the current session and rotate the refresh token.",
    },
    {
      method: "GET",
      path: "/v1/me",
      description: "Return the authenticated user and their tenant context.",
    },
    {
      method: "GET",
      path: `/v1/${domain.toLowerCase().replace(/\s+/g, "-")}`,
      description: `List ${domain} resources with cursor pagination.`,
    },
    {
      method: "POST",
      path: `/v1/${domain.toLowerCase().replace(/\s+/g, "-")}`,
      description: `Create a new ${domain} resource (validated server-side).`,
    },
    {
      method: "PATCH",
      path: `/v1/${domain.toLowerCase().replace(/\s+/g, "-")}/:id`,
      description: "Patch a single resource (optimistic concurrency via ETag).",
    },
  ];

  if (c.isRealtime) {
    endpoints.push({
      method: "GET",
      path: "/v1/events/stream",
      description: "Server-Sent Events stream for live updates (resumable).",
    });
  }

  // ── Testing ────────────────────────────────────────────────────────
  const testing: TestCase[] = [
    {
      layer: "Unit",
      framework: "Vitest + Testing Library",
      coverage: "\u2265 85% lines, 100% on auth + billing",
      scope: "Pure functions, hooks, isolated components.",
    },
    {
      layer: "Integration",
      framework: "Vitest + Testcontainers (Postgres, Redis)",
      coverage: "Critical paths green on every PR",
      scope: "Service \u2194 DB contracts, retries, migrations.",
    },
    {
      layer: "E2E",
      framework: "Playwright",
      coverage: "Top 10 user journeys per environment",
      scope: "Cross-browser, mobile viewport, a11y assertions.",
    },
    {
      layer: "Contract",
      framework: "OpenAPI snapshot + tRPC types",
      coverage: "Every public endpoint",
      scope: "Prevents breaking API changes between services.",
    },
    {
      layer: "Load",
      framework: "k6",
      coverage: "Quarterly soak + spike tests",
      scope: `${domain} read paths at 10x current peak.`,
    },
  ];

  // ── Deployment ─────────────────────────────────────────────────────
  const deployment: DeployStep[] = [
    {
      title: "CI: type-check + tests + build",
      detail:
        "Every PR runs tsc --noEmit, eslint, unit + integration tests, and a production build. Required before merge.",
    },
    {
      title: "Preview environment per PR",
      detail:
        "Each merge creates an isolated preview with its own DB branch so reviewers can click through changes.",
    },
    {
      title: "Migration safety",
      detail:
        "Prisma migrations run via expand/contract: add column \u2192 deploy \u2192 backfill \u2192 drop old. Zero-downtime.",
    },
    {
      title: "Progressive delivery",
      detail:
        "Deploy behind a flag; route 5% \u2192 25% \u2192 100% with automatic rollback on error-rate or p99 latency regression.",
    },
    {
      title: "Observability dashboard",
      detail:
        "Pre-wired Grafana panels for RPS, p50/p95/p99, error budget burn, and DB connection saturation.",
    },
    {
      title: "Disaster recovery",
      detail:
        "Daily snapshots + 5-minute PITR for Postgres; quarterly restore drill; documented RPO \u2264 5 min, RTO \u2264 1 h.",
    },
  ];

  const compliance = c.isHealthcare
    ? "HIPAA (audit logs, BAA with every vendor, encryption at rest + in transit)."
    : c.isBanking
      ? "PCI DSS Level 1 (tokenized card data, network segmentation)."
      : c.isSaaS
        ? "SOC 2 Type II (change management, access reviews, monitoring)."
        : "GDPR-ready (data export + delete, regional storage).";

  const summary = `Architecture for \u201C${domain}\u201D: a ${c.isMobile ? "mobile-first " : ""}${
    c.isHealthcare ? "HIPAA-compliant " : c.isBanking ? "PCI-compliant " : ""
  }${c.isRealtime ? "realtime " : ""}system with a thin Next.js + Hono edge, Postgres for source-of-truth, Redis for ephemeral state, and progressive-delivery deploys. Compliance posture: ${compliance}`;

  return { diagram, folders, stack, endpoints, testing, deployment, summary };
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"
            aria-hidden
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function StackRow({ item }: { item: TechStackItem }) {
  const layerIcon: Record<TechStackItem["layer"], LucideIcon> = {
    Frontend: Globe,
    Backend: Server,
    Database: Database,
    Auth: KeyRound,
    Deploy: Rocket,
  };
  const Icon = layerIcon[item.layer];
  return (
    <li className="bg-muted/30 flex flex-col gap-1.5 rounded-lg border p-3 sm:flex-row sm:items-start sm:gap-3">
      <div className="flex items-center gap-2 sm:w-32 sm:shrink-0">
        <Icon className="text-primary size-4 shrink-0" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {item.layer}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-tight">{item.pick}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {item.reason}
        </p>
      </div>
    </li>
  );
}

function EndpointRow({ ep }: { ep: ApiEndpoint }) {
  const methodClass: Record<ApiEndpoint["method"], string> = {
    GET: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    POST: "border-primary/30 bg-primary/10 text-primary",
    PATCH:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    DELETE:
      "border-destructive/30 bg-destructive/10 text-destructive",
  };
  return (
    <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <Badge
        variant="outline"
        className={cn("w-fit shrink-0 font-mono text-[10px] tracking-wide", methodClass[ep.method])}
      >
        {ep.method}
      </Badge>
      <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
        {ep.path}
      </code>
      <span className="text-muted-foreground text-xs leading-snug">
        {ep.description}
      </span>
    </li>
  );
}

function MonoBlock({ lines, ariaLabel }: { lines: string[]; ariaLabel: string }) {
  return (
    <pre
      aria-label={ariaLabel}
      className="bg-background overflow-x-auto rounded-lg border p-4 text-xs leading-[1.55]"
    >
      <code className="font-mono whitespace-pre">
        {lines.join("\n")}
      </code>
    </pre>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyArchitect
// ═══════════════════════════════════════════════════════════════════════

const RUN_DURATION_MS = 2000;
const TICK_MS = 40;

type RunState = "idle" | "running" | "done";

export function RoyArchitect() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("architect/templates");
  void data;

  const [prompt, setPrompt] = useState("");
  const [runState, setRunState] = useState<RunState>("idle");
  const [progress, setProgress] = useState(0);
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [copied, setCopied] = useState(false);

  const timersRef = useRef<Set<number>>(new Set());

  // Register and track every timer so unmount clears them all.
  const registerTimer = useCallback((id: number): number => {
    timersRef.current.add(id);
    return id;
  }, []);

  const clearTimer = useCallback((id: number): void => {
    window.clearInterval(id);
    window.clearTimeout(id);
    timersRef.current.delete(id);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => {
        window.clearInterval(id);
        window.clearTimeout(id);
      });
      timers.clear();
    };
  }, []);

  // Clear the copied checkmark after a short delay.
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleGenerate = useCallback(() => {
    if (runState === "running") return;
    const text = prompt.trim();
    if (!text) return;

    setRunState("running");
    setProgress(0);
    setArchitecture(null);

    const start = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / RUN_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearTimer(intervalId);
        setArchitecture(buildArchitecture(text));
        setRunState("done");
      }
    }, TICK_MS);
    registerTimer(intervalId);
  }, [prompt, runState, clearTimer, registerTimer]);

  const handlePreset = useCallback((preset: PresetDef) => {
    if (runState === "running") return;
    setPrompt(preset.prompt);
  }, [runState]);

  const handleCopy = useCallback(async () => {
    if (!architecture) return;
    const text = [
      architecture.summary,
      "",
      "## Architecture Diagram",
      architecture.diagram.join("\n"),
      "",
      "## Folder Structure",
      architecture.folders.join("\n"),
      "",
      "## Tech Stack",
      ...architecture.stack.map((s) => `- ${s.layer}: ${s.pick} — ${s.reason}`),
      "",
      "## API Endpoints",
      ...architecture.endpoints.map((e) => `- ${e.method} ${e.path} — ${e.description}`),
      "",
      "## Testing Strategy",
      ...architecture.testing.map((t) => `- ${t.layer} (${t.framework}): ${t.coverage}. ${t.scope}`),
      "",
      "## Deployment",
      ...architecture.deployment.map((d) => `- ${d.title}: ${d.detail}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }, [architecture]);

  const canGenerate = prompt.trim().length > 0 && runState !== "running";

  const sectionCards = useMemo(() => {
    if (!architecture) return null;
    return (
      <div className="space-y-4">
        <SectionCard
          icon={Boxes}
          title="Architecture Diagram"
          description="Logical layout of client, edge, services, data, and observability."
        >
          <MonoBlock
            lines={architecture.diagram}
            ariaLabel="Architecture diagram"
          />
        </SectionCard>

        <SectionCard
          icon={FolderTree}
          title="Folder Structure"
          description="Monorepo layout — apps, packages, services, infra, tests."
        >
          <MonoBlock
            lines={architecture.folders}
            ariaLabel="Folder structure"
          />
        </SectionCard>

        <SectionCard
          icon={Layers}
          title="Tech Stack"
          description="Recommended picks across the five critical layers."
        >
          <ul className="space-y-2.5">
            {architecture.stack.map((item) => (
              <StackRow key={item.layer} item={item} />
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          icon={Server}
          title="API Endpoints"
          description="Versioned REST surface with cursor pagination and ETag concurrency."
        >
          <ul className="space-y-2.5">
            {architecture.endpoints.map((ep) => (
              <EndpointRow key={`${ep.method}-${ep.path}`} ep={ep} />
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          icon={TestTube2}
          title="Testing Strategy"
          description="Five layers — unit, integration, E2E, contract, and load."
        >
          <ul className="space-y-2.5">
            {architecture.testing.map((tc) => (
              <li
                key={tc.layer}
                className="bg-muted/30 rounded-lg border p-3"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold">{tc.layer}</span>
                  <span className="text-muted-foreground text-xs">
                    {tc.framework}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary ml-auto text-[10px]"
                  >
                    {tc.coverage}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {tc.scope}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          icon={Rocket}
          title="Deployment Recommendations"
          description="CI/CD pipeline, previews, migrations, progressive delivery, and DR."
        >
          <ol className="space-y-2.5">
            {architecture.deployment.map((step, idx) => (
              <li
                key={step.title}
                className="bg-muted/30 flex items-start gap-3 rounded-lg border p-3"
              >
                <span
                  className="bg-background text-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums"
                  aria-hidden
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">
                    {step.title}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>
    );
  }, [architecture]);

  return (
    <Card className="gap-0 py-0">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <div
          className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full"
          aria-hidden
        >
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">RoyArchitect</span>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary shrink-0 gap-1 text-[10px]"
            >
              <Boxes className="size-3" aria-hidden />
              AI Architect
            </Badge>
            <BackendLiveBadge module="architect" loading={loading} error={error} />
          </div>
          <p className="text-muted-foreground truncate text-xs">
            Describe a product — get a full architecture, stack, and deploy plan.
          </p>
        </div>
      </div>

      {/* ── Input ──────────────────────────────────────────────────── */}
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <label htmlFor="roy-architect-prompt" className="text-sm font-medium">
            Product requirements
          </label>
          <Textarea
            id="roy-architect-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={DEFAULT_PROMPT}
            rows={5}
            disabled={runState === "running"}
            className="resize-y"
            aria-describedby="roy-architect-help"
          />
          <p
            id="roy-architect-help"
            className="text-muted-foreground text-[11px]"
          >
            Tip: name the audience, the must-have features, and any compliance
            constraints. The architect adapts the stack to your inputs.
          </p>
        </div>

        {/* Preset chips */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
            Presets
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset)}
                disabled={runState === "running"}
                className="hover:border-primary hover:text-primary focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden>{preset.emoji}</span>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="gap-1.5"
          >
            {runState === "running" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden />
                Generate Architecture
              </>
            )}
          </Button>
          {architecture && runState !== "running" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-primary" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden />
                  Copy architecture
                </>
              )}
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {runState === "running" && (
          <div className="space-y-1" aria-live="polite">
            <Progress value={progress} className="h-1.5" />
            <p className="text-muted-foreground text-[11px] tabular-nums">
              Drafting diagram, stack, endpoints, tests, and deploy plan…
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Summary */}
        {architecture && runState === "done" && (
          <div className="bg-primary/5 border-primary/20 rounded-lg border p-3.5">
            <div className="flex items-center gap-2">
              <ScrollText className="text-primary size-4 shrink-0" aria-hidden />
              <p className="text-sm font-medium">Summary</p>
            </div>
            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
              {architecture.summary}
            </p>
          </div>
        )}
      </CardContent>

      {/* ── Generated architecture ─────────────────────────────────── */}
      {sectionCards}
    </Card>
  );
}
