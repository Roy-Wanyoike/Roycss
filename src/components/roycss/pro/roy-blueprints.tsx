"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * Roy Blueprints — complete application architectures.
 *
 * Self-contained (no props). Eight production-grade application
 * blueprints (Hospital Management, POS System, ERP, HR Platform,
 * Banking App, Education Portal, AI Dashboard, Logistics/Fleet),
 * each rendered in a card grid with full architecture detail.
 *
 * Features:
 *
 *   • Search bar — case-insensitive filter on blueprint name.
 *   • Industry filter chips — All / Healthcare / Retail / Finance /
 *     Education / Logistics / AI (single-select toggle, color-coded
 *     with the approved RoyCSS palette — emerald/rose/amber/cyan/
 *     teal/violet — no indigo/blue).
 *   • Aggregate header — total blueprints, visible count, average
 *     feature count, average timeline weeks.
 *   • Blueprint card — icon tile, name, description, industry badge,
 *     complexity badge, feature count, timeline. Two CTAs per card:
 *     "Generate Project" (fires a shadcn toast) and "View Architecture"
 *     (opens a Dialog with three tabs).
 *   • Architecture dialog — Tabbed view with:
 *       - Architecture: ASCII folder tree in a `<pre>` block with
 *         syntax-ish coloring (comments dimmed) + Copy button.
 *       - API Endpoints: list of HTTP method badges + paths +
 *         descriptions, color-coded per method.
 *       - Deployment: tech stack grid (frontend/backend/database/auth/
 *         deployment), auth strategy callout, and a numbered deploy
 *         guide in a `<pre>` block.
 *
 * Filtering is fully memoized. TS strict, zero `any`. Color discipline
 * honors RoyCSS palette (no indigo/blue). SSR-safe — all interactive
 * state is React-local; no direct `window` access at module scope.
 */

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Boxes,
  Building2,
  CalendarDays,
  Check,
  Copy,
  FolderTree,
  GraduationCap,
  HeartPulse,
  Layers,
  ListChecks,
  Rocket,
  RotateCcw,
  ScanLine,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type Industry =
  | "Healthcare"
  | "Retail"
  | "Finance"
  | "Education"
  | "Logistics"
  | "AI";

type IndustryFilter = "All" | Industry;

type Complexity = "Enterprise" | "Mid-market" | "Startup";

interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  description: string;
}

interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  auth: string;
  deployment: string;
}

interface Blueprint {
  id: string;
  name: string;
  description: string;
  industry: Industry;
  complexity: Complexity;
  /** ASCII folder tree, ready to render inside a `<pre>`. */
  architecture: string;
  features: readonly string[];
  techStack: TechStack;
  /** Human-readable timeline, e.g. "14 weeks". */
  timeline: string;
  /** Numeric timeline in weeks — used for stats. */
  timelineWeeks: number;
  endpoints: readonly ApiEndpoint[];
  authStrategy: string;
  /** Multi-line deploy guide (one step per line). */
  deploymentGuide: string;
  icon: LucideIcon;
}

interface IndustryMeta {
  /** Badge classes for the small industry label on cards/dialog. */
  badge: string;
  /** Active filter chip classes. */
  chipActive: string;
}

interface ComplexityMeta {
  badge: string;
  dot: string;
}

interface MethodMeta {
  badge: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const INDUSTRY_ORDER: readonly IndustryFilter[] = [
  "All",
  "Healthcare",
  "Retail",
  "Finance",
  "Education",
  "Logistics",
  "AI",
] as const;

const INDUSTRY_META: Record<Industry, IndustryMeta> = {
  Healthcare: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
  },
  Retail: {
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    chipActive:
      "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
  },
  Finance: {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
  },
  Education: {
    badge:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
    chipActive:
      "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-200",
  },
  Logistics: {
    badge:
      "border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
    chipActive:
      "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/70 dark:text-teal-200",
  },
  AI: {
    badge:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    chipActive:
      "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
  },
};

const COMPLEXITY_META: Record<Complexity, ComplexityMeta> = {
  Enterprise: {
    badge:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  "Mid-market": {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  Startup: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};

const METHOD_META: Record<HttpMethod, MethodMeta> = {
  GET: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  POST: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  },
  PATCH: {
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
  },
  PUT: {
    badge:
      "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
  },
  DELETE: {
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Strip the common leading indentation from a template-literal string.
 * Lets us author multi-line ASCII trees / deploy guides with normal
 * source-code indentation while producing column-0 output for `<pre>`.
 *
 *   dedent`
 *     foo/
 *     ├── bar/
 *     └── baz/
 *   `
 *   → "foo/\n├── bar/\n└── baz/"
 */
function dedent(literals: TemplateStringsArray): string {
  const raw = literals.raw[0] ?? "";
  const lines = raw.split("\n");
  // Drop surrounding empty lines.
  while (lines.length > 0 && lines[0].trim() === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  if (lines.length === 0) return "";
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const match = /^ */.exec(line);
    const indent = match ? match[0].length : 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (!Number.isFinite(minIndent)) minIndent = 0;
  return lines.map((line) => line.slice(minIndent)).join("\n");
}

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

// ═══════════════════════════════════════════════════════════════════════
// Mock data — 8 complete application blueprints
// ═══════════════════════════════════════════════════════════════════════

const BLUEPRINTS: readonly Blueprint[] = [
  // ─── 1. Hospital Management ──────────────────────────────────────────
  {
    id: "bp-hospital-management",
    name: "Hospital Management",
    description:
      "A clinical-grade platform spanning patient portal, staff scheduling, lab results, and e-prescribing — built on HL7 FHIR R4 with HIPAA-grade audit logging.",
    industry: "Healthcare",
    complexity: "Enterprise",
    timeline: "16 weeks",
    timelineWeeks: 16,
    icon: HeartPulse,
    architecture: dedent`
      hospital-management/
      ├── apps/
      │   ├── web/                       # Next.js 16 patient portal
      │   │   ├── app/
      │   │   │   ├── (auth)/            # login + MFA
      │   │   │   │   ├── login/
      │   │   │   │   └── verify/
      │   │   │   ├── (patient)/
      │   │   │   │   ├── dashboard/
      │   │   │   │   ├── appointments/
      │   │   │   │   ├── lab-results/
      │   │   │   │   └── prescriptions/
      │   │   │   └── (staff)/
      │   │   │       ├── patients/
      │   │   │       ├── schedule/
      │   │   │       └── rounds/
      │   │   ├── components/
      │   │   └── lib/
      │   └── api/                       # tRPC routers + Edge fns
      │       ├── routers/
      │       │   ├── patient.ts
      │       │   ├── appointment.ts
      │       │   └── lab.ts
      │       └── middleware/
      │           ├── hipaa-log.ts
      │           └── rbac.ts
      ├── packages/
      │   ├── ui/                        # shared design system
      │   ├── hl7/                       # HL7 FHIR R4 client
      │   ├── auth/                      # OIDC + SMART-on-FHIR
      │   └── schema/                    # Zod + Prisma types
      ├── prisma/
      │   ├── schema.prisma
      │   └── migrations/
      ├── infra/
      │   ├── terraform/
      │   └── docker/
      ├── turbo.json
      └── package.json
    `,
    features: [
      "Patient portal with appointment booking",
      "Staff scheduling with conflict detection",
      "Lab results with abnormal-value flags",
      "E-prescribing with drug-interaction checks",
      "HL7 FHIR R4 interoperability layer",
      "Role-based access (patient/nurse/physician/admin)",
      "HIPAA-compliant audit trail on every PHI read",
      "SMART-on-FHIR third-party app launch",
      "Bed management + admission/discharge flow",
      "Billing + insurance claim generation",
    ],
    techStack: {
      frontend: "Next.js 16 + TypeScript + Tailwind 4",
      backend: "Node.js + tRPC + Fastify",
      database: "PostgreSQL + Redis (cache/queues)",
      auth: "OIDC + SMART-on-FHIR + TOTP MFA",
      deployment: "AWS ECS Fargate + Terraform",
    },
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/login",
        description: "Authenticate staff/patient; issues MFA challenge",
      },
      {
        method: "GET",
        path: "/api/v1/patients/:id",
        description: "Fetch patient record (HIPAA-scoped)",
      },
      {
        method: "POST",
        path: "/api/v1/appointments",
        description: "Book a new appointment; checks provider availability",
      },
      {
        method: "GET",
        path: "/api/v1/patients/:id/lab-results",
        description: "List lab results with abnormal-value flags",
      },
      {
        method: "POST",
        path: "/api/v1/prescriptions",
        description: "Issue a signed prescription (drug-interaction checked)",
      },
      {
        method: "GET",
        path: "/api/v1/schedule/:date",
        description: "Get staff schedule for a given date",
      },
      {
        method: "POST",
        path: "/api/v1/fhir/observation",
        description: "Push a FHIR R4 observation to the record",
      },
    ],
    authStrategy:
      "OIDC + SMART-on-FHIR scopes; per-encounter RBAC; MFA enforced via TOTP. Every PHI access is logged for HIPAA audit and retained for 6 years.",
    deploymentGuide: dedent`
      1. Provision VPC + private subnets via Terraform
      2. Deploy API to ECS Fargate behind ALB (TLS 1.3)
      3. RDS Postgres (encrypted, multi-AZ) + ElastiCache Redis
      4. Configure WAF + CloudFront for the patient web app
      5. Enable CloudWatch + CloudTrail for HIPAA logging
      6. Execute BAA-covered penetration test before go-live
    `,
  },

  // ─── 2. POS System ───────────────────────────────────────────────────
  {
    id: "bp-pos-system",
    name: "POS System",
    description:
      "A multi-terminal point-of-sale suite — register, kitchen display, self-service kiosk, and back-office — with offline-first CRDT sync and Stripe Terminal integration.",
    industry: "Retail",
    complexity: "Mid-market",
    timeline: "10 weeks",
    timelineWeeks: 10,
    icon: ScanLine,
    architecture: dedent`
      pos-system/
      ├── apps/
      │   ├── register/                  # cashier UI (offline-first PWA)
      │   │   ├── app/
      │   │   ├── components/
      │   │   └── lib/
      │   ├── kitchen/                   # kitchen display system
      │   ├── kiosk/                     # self-service kiosk
      │   └── manager/                   # back-office dashboard
      ├── packages/
      │   ├── receipts/                  # thermal printer templates
      │   ├── payments/                  # Stripe Terminal client
      │   ├── inventory/                 # stock + variant logic
      │   └── offline-sync/              # CRDT offline queue
      ├── services/
      │   ├── payment-worker/            # BullMQ queue worker
      │   ├── tax-engine/                # jurisdiction tax rules
      │   └── loyalty/                   # points + rewards
      ├── prisma/
      │   ├── schema.prisma
      │   └── migrations/
      ├── docker-compose.yml
      ├── turbo.json
      └── package.json
    `,
    features: [
      "Offline-first register with CRDT sync",
      "Stripe Terminal card-present payments",
      "Kitchen display with order routing",
      "Self-service kiosk mode (biometric unlock)",
      "Multi-location inventory tracking",
      "Tax engine with jurisdiction rules",
      "Refund + void with manager override",
      "Shift open/close with cash reconciliation",
      "Loyalty points + customer lookup",
      "Real-time sales dashboard",
    ],
    techStack: {
      frontend: "Next.js 16 + React Native Web (kiosk/register)",
      backend: "Node.js + tRPC + BullMQ",
      database: "PostgreSQL + Redis (offline queue)",
      auth: "JWT (HS256) + PIN + biometric unlock",
      deployment: "Fly.io multi-region + Cloudflare",
    },
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/login",
        description: "Cashier login (PIN + optional biometric)",
      },
      {
        method: "POST",
        path: "/api/v1/transactions",
        description: "Create a new sale; queues payment capture",
      },
      {
        method: "GET",
        path: "/api/v1/products",
        description: "List/search products with category filter",
      },
      {
        method: "POST",
        path: "/api/v1/transactions/:id/refund",
        description: "Process a refund (manager override required)",
      },
      {
        method: "GET",
        path: "/api/v1/shifts/current",
        description: "Get the current open shift for a register",
      },
      {
        method: "POST",
        path: "/api/v1/shifts/close",
        description: "Close out a register shift with cash count",
      },
      {
        method: "GET",
        path: "/api/v1/inventory/low-stock",
        description: "List items below reorder threshold",
      },
    ],
    authStrategy:
      "JWT (HS256) for cashiers; PIN + manager override for voids/refunds; biometric unlock for kiosk mode. Tokens scoped to terminal + shift.",
    deploymentGuide: dedent`
      1. Containerize register/kiosk as offline-first PWAs
      2. Deploy API to Fly.io across multiple regions
      3. Postgres (read replica per region) + Redis for queues
      4. Pair Stripe Terminal SDK per physical device
      5. Configure Cloudflare for kiosk OTA updates
      6. Verify offline queue replays on reconnect
    `,
  },

  // ─── 3. ERP Suite ────────────────────────────────────────────────────
  {
    id: "bp-erp-suite",
    name: "ERP Suite",
    description:
      "A modular enterprise resource planning suite — accounting, procurement, inventory, manufacturing, HR/payroll, and CRM — wired together via an event bus with module-federated UI.",
    industry: "Finance",
    complexity: "Enterprise",
    timeline: "24 weeks",
    timelineWeeks: 24,
    icon: Building2,
    architecture: dedent`
      erp-suite/
      ├── apps/
      │   ├── web/                       # main shell (Module Federation)
      │   │   ├── app/
      │   │   ├── modules/               # remote module mounts
      │   │   └── lib/
      │   ├── mobile/                    # field worker app (Expo)
      │   └── reports/                   # BI portal
      ├── modules/
      │   ├── accounting/                # GL + AR/AP
      │   ├── procurement/               # PO + vendor mgmt
      │   ├── inventory/                 # multi-warehouse
      │   ├── manufacturing/             # BOM + MRP
      │   ├── hr-payroll/                # payroll engine
      │   └── crm/                       # leads + opportunities
      ├── packages/
      │   ├── rbac/                      # role-based access control
      │   ├── audit-log/                 # immutable audit trail
      │   ├── workflow/                  # approval workflows
      │   └── erp-ui/                    # shared ERP components
      ├── services/
      │   ├── event-bus/                 # NATS JetStream
      │   ├── etl/                       # nightly ETL pipelines
      │   └── report-renderer/           # PDF/XLSX export
      ├── prisma/
      ├── k8s/
      │   └── helm/
      ├── turbo.json
      └── package.json
    `,
    features: [
      "Double-entry general ledger (GAAP/IFRS)",
      "Accounts payable + receivable workflows",
      "Multi-warehouse inventory with stock transfers",
      "Bill of materials + MRP scheduling",
      "Payroll engine with tax tables",
      "CRM pipeline with opportunity forecasting",
      "Module-federated micro-frontend shell",
      "Role-based access with row-level security",
      "Immutable audit trail on every mutation",
      "Approval workflows with delegation",
      "Scheduled + ad-hoc report builder",
    ],
    techStack: {
      frontend: "Next.js 16 + Module Federation + Tailwind 4",
      backend: "NestJS (modular) + NATS JetStream",
      database: "PostgreSQL (tenant-partitioned) + ClickHouse",
      auth: "SAML 2.0 SSO (Okta/Azure AD)",
      deployment: "Kubernetes + Argo CD + Helm",
    },
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/login",
        description: "SSO login via SAML/OIDC",
      },
      {
        method: "GET",
        path: "/api/v1/gl/accounts",
        description: "List general ledger accounts",
      },
      {
        method: "POST",
        path: "/api/v1/gl/journal-entries",
        description: "Post a double-entry journal entry",
      },
      {
        method: "GET",
        path: "/api/v1/inventory/items/:id/stock",
        description: "Get stock levels across warehouses",
      },
      {
        method: "POST",
        path: "/api/v1/procurement/purchase-orders",
        description: "Create a purchase order with approval flow",
      },
      {
        method: "GET",
        path: "/api/v1/crm/opportunities",
        description: "List sales opportunities with forecast",
      },
      {
        method: "POST",
        path: "/api/v1/payroll/runs",
        description: "Initiate a payroll cycle for a period",
      },
    ],
    authStrategy:
      "SAML 2.0 SSO (Okta/Azure AD); module-scoped RBAC; row-level security via tenant_id; immutable audit trail on every mutation.",
    deploymentGuide: dedent`
      1. Build monorepo via Turborepo; publish module packages
      2. Deploy each module as an independent Kubernetes service
      3. Postgres (partitioned by tenant) + NATS JetStream
      4. Module Federation for the web shell (remote-entry per module)
      5. CI/CD via GitHub Actions → Argo CD (GitOps)
      6. Blue-green deploys with audit-log verification gate
    `,
  },

  // ─── 4. HR Platform ──────────────────────────────────────────────────
  {
    id: "bp-hr-platform",
    name: "HR Platform",
    description:
      "A full human-resources suite — employee self-service, manager approvals, recruiting ATS, and payroll — with org-chart visualization and SAML/OIDC SSO.",
    industry: "Finance",
    complexity: "Mid-market",
    timeline: "12 weeks",
    timelineWeeks: 12,
    icon: Users,
    architecture: dedent`
      hr-platform/
      ├── apps/
      │   ├── employee/                  # self-service portal
      │   │   ├── app/
      │   │   ├── components/
      │   │   └── lib/
      │   ├── manager/                   # approvals + team view
      │   ├── recruiter/                 # ATS (applicant tracking)
      │   └── admin/                     # HR admin settings
      ├── packages/
      │   ├── payroll/                   # payroll calc engine
      │   ├── orgchart/                  # org visualizer
      │   ├── timeoff/                   # PTO accrual logic
      │   ├── reviews/                   # 360° review cycles
      │   └── hr-ui/                     # shared HR components
      ├── services/
      │   ├── notification-worker/       # email/Slack/SMS fan-out
      │   ├── document-store/            # S3 + signed URLs
      │   ├── audit/                     # audit event log
      │   └── sso/                       # SAML/OIDC bridge
      ├── prisma/
      ├── terraform/
      ├── turbo.json
      └── package.json
    `,
    features: [
      "Employee self-service (profile, pay stubs, W-2)",
      "PTO requests with accrual rules",
      "Manager approvals with delegation",
      "Applicant tracking system (ATS)",
      "360° review cycles with calibration",
      "Payroll engine with tax + benefits",
      "Org chart visualization",
      "Document storage with signed URLs",
      "SSO via SAML/OIDC (Okta)",
      "Notification fan-out (email/Slack/SMS)",
      "Field-level encryption for SSN/salary",
    ],
    techStack: {
      frontend: "Next.js 16 + TypeScript + Tailwind 4",
      backend: "Node.js + tRPC + BullMQ",
      database: "PostgreSQL + Redis (queues)",
      auth: "SAML 2.0 / OIDC SSO + per-field encryption",
      deployment: "AWS ECS Fargate + Terraform",
    },
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/sso",
        description: "SAML/OIDC SSO callback; exchanges for session",
      },
      {
        method: "GET",
        path: "/api/v1/employees/:id",
        description: "Get employee profile (SSN/salary encrypted)",
      },
      {
        method: "POST",
        path: "/api/v1/timeoff/requests",
        description: "Submit a PTO request with accrual check",
      },
      {
        method: "GET",
        path: "/api/v1/org/employees/:id/reports",
        description: "Get direct + skip-level reports",
      },
      {
        method: "POST",
        path: "/api/v1/payroll/runs/:id/approve",
        description: "Approve a payroll run (two-person rule)",
      },
      {
        method: "GET",
        path: "/api/v1/recruiting/applications",
        description: "List job applications with stage filter",
      },
      {
        method: "POST",
        path: "/api/v1/reviews/cycles/:id/submit",
        description: "Submit a 360° review for a peer",
      },
    ],
    authStrategy:
      "SAML/OIDC SSO; attribute-based access (manager/employee/recruiter); IP allowlist for admin actions; per-field encryption for SSN/salary; SOC 2 access review automation.",
    deploymentGuide: dedent`
      1. Provision VPC + KMS-backed S3 for HR documents
      2. Deploy to ECS Fargate (web + worker split)
      3. RDS Postgres with column-level encryption (KMS)
      4. SAML/OIDC IdP integration (Okta recommended)
      5. CloudWatch + SES for notification fan-out
      6. Annual SOC 2 access review automation (Lambda)
    `,
  },

  // ─── 5. Banking App ──────────────────────────────────────────────────
  {
    id: "bp-banking-app",
    name: "Banking App",
    description:
      "A consumer + business banking experience — accounts, transfers, statements, cards, and KYC — backed by an event-sourced ledger and PCI-DSS scoped infrastructure.",
    industry: "Finance",
    complexity: "Enterprise",
    timeline: "20 weeks",
    timelineWeeks: 20,
    icon: Wallet,
    architecture: dedent`
      banking-app/
      ├── apps/
      │   ├── mobile/                    # React Native (iOS/Android)
      │   │   ├── src/
      │   │   │   ├── screens/
      │   │   │   ├── components/
      │   │   │   └── lib/
      │   │   └── app.config.ts
      │   ├── web/                       # Next.js online banking
      │   └── ops/                       # internal ops dashboard
      ├── packages/
      │   ├── transactions/              # double-entry ledger
      │   ├── fraud/                     # fraud detection rules
      │   ├── statements/                # PDF statement generator
      │   ├── biometric/                 # FaceID/Fingerprint bridge
      │   └── banking-ui/                # shared banking UI
      ├── services/
      │   ├── core-banking/              # event-sourced ledger
      │   ├── payment-rails/             # ACH/SEPA/SWIFT adapters
      │   ├── fx-service/                # FX rate provider
      │   ├── webhook-dispatcher/        # signed webhooks
      │   └── kyc/                       # KYC/AML screening
      ├── infra/
      │   ├── helm/
      │   └── vault/                     # HashiCorp Vault
      ├── prisma/
      └── README.md
    `,
    features: [
      "Account balances with real-time ledger",
      "ACH/SEPA/SWIFT transfers",
      "Person-to-person payments (Zelle-style)",
      "Card management (freeze/replace)",
      "Biometric authentication",
      "Step-up 2FA for high-value transfers",
      "Statement generation (PDF, e-delivery)",
      "Transaction categorization + budgets",
      "Fraud detection with rule engine",
      "KYC/AML screening workflow",
      "Signed webhook delivery to partners",
    ],
    techStack: {
      frontend: "Next.js 16 + React Native + Tailwind 4",
      backend: "NestJS + EventStoreDB + tRPC",
      database: "PostgreSQL + EventStoreDB (ledger)",
      auth: "OAuth 2.0 + PKCE + biometric + 2FA",
      deployment: "AWS EKS + HashiCorp Vault + HSM",
    },
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/biometric",
        description: "Biometric session challenge (FaceID/Fingerprint)",
      },
      {
        method: "GET",
        path: "/api/v1/accounts",
        description: "List customer accounts with balances",
      },
      {
        method: "GET",
        path: "/api/v1/accounts/:id/transactions",
        description: "Paginated transaction history",
      },
      {
        method: "POST",
        path: "/api/v1/transfers",
        description: "Initiate a transfer (step-up 2FA required)",
      },
      {
        method: "POST",
        path: "/api/v1/bills/pay",
        description: "Pay a biller from a linked account",
      },
      {
        method: "GET",
        path: "/api/v1/statements/:id/download",
        description: "Download a signed PDF statement",
      },
      {
        method: "POST",
        path: "/api/v1/cards/:id/freeze",
        description: "Freeze a lost/stolen card instantly",
      },
    ],
    authStrategy:
      "OAuth 2.0 + PKCE; biometric re-auth for transfers; step-up 2FA (SMS/HW token) for high-value; per-action signed challenges; Vault-managed keys with HSM backing.",
    deploymentGuide: dedent`
      1. Provision PCI-DSS scoped VPC (fully isolated)
      2. Deploy core-banking to EKS with PodSecurityPolicies
      3. Aurora Postgres (encrypted, cross-region replica)
      4. HashiCorp Vault for key management (HSM-backed)
      5. AWS WAF + Shield Advanced + mTLS between services
      6. Run PCI-DSS QSA audit before production cutover
    `,
  },

  // ─── 6. Education Portal ─────────────────────────────────────────────
  {
    id: "bp-education-portal",
    name: "Education Portal",
    description:
      "A K-12 / higher-ed LMS suite — student portal, teacher gradebook, parent visibility, and district admin — with LTI 1.3 integration and FERPA-compliant audit.",
    industry: "Education",
    complexity: "Mid-market",
    timeline: "14 weeks",
    timelineWeeks: 14,
    icon: GraduationCap,
    architecture: dedent`
      education-portal/
      ├── apps/
      │   ├── student/                   # student LMS portal
      │   │   ├── app/
      │   │   ├── components/
      │   │   └── lib/
      │   ├── teacher/                   # gradebook + planner
      │   ├── parent/                    # parent visibility portal
      │   └── admin/                     # district admin console
      ├── packages/
      │   ├── grading/                   # grade calc engine
      │   ├── curriculum/                # curriculum mapper
      │   ├── assignments/               # submission workflow
      │   ├── attendance/                # attendance + rosters
      │   └── edu-ui/                    # shared edu components
      ├── services/
      │   ├── plagiarism/                # plagiarism checker worker
      │   ├── video-transcoder/          # ffmpeg pipeline
      │   ├── analytics/                 # engagement metrics
      │   └── lti-bridge/                # LTI 1.3 integration
      ├── prisma/
      ├── docker/
      ├── turbo.json
      └── package.json
    `,
    features: [
      "Student dashboard with course list",
      "Teacher gradebook with weighting",
      "Assignment submission + rubric grading",
      "Attendance with rosters + flags",
      "Parent visibility portal",
      "District admin with school scoping",
      "LTI 1.3 launch (Canvas/Moodle)",
      "Video lessons with chapter markers",
      "Plagiarism checker integration",
      "Engagement analytics dashboard",
      "Announcements + messaging",
    ],
    techStack: {
      frontend: "Next.js 16 + TypeScript + Tailwind 4",
      backend: "Node.js + tRPC + BullMQ",
      database: "PostgreSQL + S3 (video assets)",
      auth: "LTI 1.3 (OIDC) + SSO + FERPA audit",
      deployment: "Render + CloudFront CDN",
    },
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/login",
        description: "Login via LTI 1.3 launch or SSO",
      },
      {
        method: "GET",
        path: "/api/v1/courses/:id",
        description: "Get course details with roster",
      },
      {
        method: "POST",
        path: "/api/v1/assignments/:id/submit",
        description: "Submit an assignment (file upload)",
      },
      {
        method: "GET",
        path: "/api/v1/students/:id/grades",
        description: "List grades for a student (FERPA-scoped)",
      },
      {
        method: "POST",
        path: "/api/v1/attendance",
        description: "Take attendance for a class period",
      },
      {
        method: "GET",
        path: "/api/v1/teachers/:id/schedule",
        description: "Get teacher schedule for a term",
      },
      {
        method: "POST",
        path: "/api/v1/courses/:id/announcements",
        description: "Post a course announcement",
      },
    ],
    authStrategy:
      "LTI 1.3 launch (OIDC flow); role-based (student/teacher/parent/admin); FERPA-compliant audit on every grade/PII read; per-class roster scoping enforced at the data layer.",
    deploymentGuide: dedent`
      1. Provision VPC + CloudFront CDN for video assets
      2. Deploy to Render/Fly.io for cost efficiency
      3. Postgres + S3 (with lifecycle to Glacier for old videos)
      4. ffmpeg transcoding workers on Spot instances
      5. Register LTI 1.3 tool with each LMS vendor
      6. FERPA training + quarterly access certification
    `,
  },

  // ─── 7. AI Dashboard ─────────────────────────────────────────────────
  {
    id: "bp-ai-dashboard",
    name: "AI Dashboard",
    description:
      "An LLM ops platform — chat completions, RAG retrieval, eval harness, prompt registry, and tracing — with vLLM inference and GPU autoscaling.",
    industry: "AI",
    complexity: "Mid-market",
    timeline: "11 weeks",
    timelineWeeks: 11,
    icon: Sparkles,
    architecture: dedent`
      ai-dashboard/
      ├── apps/
      │   ├── web/                       # Next.js analytics dashboard
      │   │   ├── app/
      │   │   ├── components/
      │   │   └── lib/
      │   ├── notebook/                  # JupyterLab integration
      │   └── admin/                     # model management console
      ├── packages/
      │   ├── eval/                      # eval + benchmark harness
      │   ├── prompts/                   # prompt registry + versioning
      │   ├── vector/                    # pgvector client
      │   ├── tracing/                   # OpenTelemetry wrappers
      │   └── ai-ui/                     # shared AI components
      ├── services/
      │   ├── inference-api/             # vLLM / TGI proxy
      │   ├── embedding-worker/          # bulk embedding queue
      │   ├── rag-retriever/             # hybrid search retriever
      │   ├── guardrails/                # I/O moderation
      │   └── model-registry/            # model version catalog
      ├── infra/
      │   ├── gpu-nodepool/              # K8s GPU autoscaler
      │   └── mlflow/                    # experiment tracking
      ├── prisma/
      └── package.json
    `,
    features: [
      "Streaming chat completions (SSE)",
      "RAG retrieval (hybrid vector + keyword)",
      "Prompt registry with versioning",
      "Eval harness with golden datasets",
      "OpenTelemetry tracing per request",
      "Guardrails (input/output moderation)",
      "Model registry with canary deploys",
      "Bulk embedding pipeline",
      "Token + cost analytics dashboard",
      "A/B prompt comparison",
      "JupyterLab notebook integration",
    ],
    techStack: {
      frontend: "Next.js 16 + TypeScript + Tailwind 4",
      backend: "FastAPI (Python) + tRPC gateway",
      database: "PostgreSQL + pgvector + Redis",
      auth: "OAuth 2.0 + scoped API keys",
      deployment: "Kubernetes + GPU node pool + MLflow",
    },
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/api-key",
        description: "Issue a scoped API key for a tenant",
      },
      {
        method: "POST",
        path: "/api/v1/chat/completions",
        description: "Streaming chat completion (SSE) with guardrails",
      },
      {
        method: "POST",
        path: "/api/v1/embeddings",
        description: "Generate embeddings (batch up to 100 inputs)",
      },
      {
        method: "POST",
        path: "/api/v1/retrieval/search",
        description: "Hybrid vector + keyword search with re-ranking",
      },
      {
        method: "GET",
        path: "/api/v1/models",
        description: "List deployed models with versions + canary %",
      },
      {
        method: "POST",
        path: "/api/v1/evals/runs",
        description: "Kick off an eval run against a golden dataset",
      },
      {
        method: "GET",
        path: "/api/v1/traces/:id",
        description: "Get a trace by ID (OpenTelemetry spans)",
      },
    ],
    authStrategy:
      "API keys with scoped permissions (read/write/admin); OAuth 2.0 for end-users; rate-limited per tier; PII redaction at the gateway before logging.",
    deploymentGuide: dedent`
      1. Provision GPU node pool (K8s + nvidia.com/gpu)
      2. Deploy vLLM/TGI behind an inference gateway
      3. Postgres + pgvector + S3 for model artifacts
      4. MLflow for experiment tracking + model registry
      5. OpenTelemetry Collector → Tempo + Grafana
      6. Cost controls: spot GPUs + request batching + KV cache
    `,
  },

  // ─── 8. Logistics / Fleet ────────────────────────────────────────────
  {
    id: "bp-logistics-fleet",
    name: "Logistics / Fleet",
    description:
      "A fleet operations platform — dispatcher control tower, driver mobile app, customer tracking, and ETA engine — with live GPS streaming and route optimization.",
    industry: "Logistics",
    complexity: "Enterprise",
    timeline: "18 weeks",
    timelineWeeks: 18,
    icon: Truck,
    architecture: dedent`
      logistics-fleet/
      ├── apps/
      │   ├── dispatcher/                # control tower UI
      │   │   ├── app/
      │   │   ├── components/
      │   │   └── lib/
      │   ├── driver/                    # driver mobile app (Expo)
      │   ├── customer/                  # tracking portal
      │   └── admin/                     # fleet admin console
      ├── packages/
      │   ├── routing/                   # route optimization (OSRM)
      │   ├── geofencing/                # geofence engine
      │   ├── telemetry/                 # IoT telemetry client
      │   └── fleet-ui/                  # shared fleet UI
      ├── services/
      │   ├── tracking-stream/           # WebSocket live positions
      │   ├── eta-engine/                # ETA prediction model
      │   ├── maintenance-scheduler/     # vehicle service intervals
      │   └── billing/                   # per-mile billing engine
      ├── infra/
      │   ├── mqtt-broker/               # Mosquitto MQTT
      │   ├── postgis/
      │   └── redis/
      ├── prisma/
      └── README.md
    `,
    features: [
      "Dispatcher control tower (live map)",
      "Driver mobile app (offline-capable)",
      "Customer tracking portal (SMS links)",
      "Route optimization (VRP solver)",
      "Geofence alerts (arrival/departure)",
      "Live GPS streaming via WebSocket",
      "ETA prediction with traffic model",
      "Vehicle maintenance scheduling",
      "Per-mile billing with fuel surcharge",
      "Proof of delivery (photo + signature)",
      "IoT telemetry ingestion (MQTT)",
    ],
    techStack: {
      frontend: "Next.js 16 + React Native (driver) + Tailwind 4",
      backend: "NestJS + WebSocket gateway + MQTT",
      database: "PostgreSQL + PostGIS + Redis Streams",
      auth: "JWT + driver tokens (scoped) + mTLS (IoT)",
      deployment: "Kubernetes + OSRM + Mosquitto",
    },
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/login",
        description: "Driver/dispatcher login (role-aware)",
      },
      {
        method: "GET",
        path: "/api/v1/shipments/:id",
        description: "Get shipment details with stops + status",
      },
      {
        method: "POST",
        path: "/api/v1/shipments/:id/assign",
        description: "Assign a shipment to a driver + vehicle",
      },
      {
        method: "POST",
        path: "/api/v1/telemetry/positions",
        description: "Push a batch of GPS positions from a device",
      },
      {
        method: "GET",
        path: "/api/v1/tracking/:id/stream",
        description: "WebSocket upgrade for live position stream",
      },
      {
        method: "GET",
        path: "/api/v1/routes/optimize",
        description: "Solve a VRP route optimization request",
      },
      {
        method: "POST",
        path: "/api/v1/vehicles/:id/maintenance",
        description: "Schedule a maintenance service interval",
      },
    ],
    authStrategy:
      "JWT for dispatchers; driver tokens scoped to assigned shipments; signed WebSocket upgrade (query-string nonce + HMAC); mutual TLS for IoT devices; geofence-based access restrictions.",
    deploymentGuide: dedent`
      1. Provision VPC + Mosquitto MQTT broker cluster (HA)
      2. Deploy API + WebSocket gateway to Kubernetes
      3. Postgres + PostGIS + Redis Streams for telemetry
      4. OSRM routing engine on dedicated nodes (memory-pinned)
      5. IoT devices provisioned via mutual TLS (cert per device)
      6. Blue-green deploys with driver app OTA (CodePush)
    `,
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface BlueprintCardProps {
  blueprint: Blueprint;
  onView: (bp: Blueprint) => void;
  onGenerate: (bp: Blueprint) => void;
}

function BlueprintCard({
  blueprint,
  onView,
  onGenerate,
}: BlueprintCardProps): React.JSX.Element {
  const Icon = blueprint.icon;
  const industryMeta = INDUSTRY_META[blueprint.industry];
  const complexityMeta = COMPLEXITY_META[blueprint.complexity];

  return (
    <Card className="group gap-0 transition-shadow hover:shadow-md">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border",
              industryMeta.badge,
            )}
            aria-hidden
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-tight">
              {blueprint.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2 text-xs">
              {blueprint.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={industryMeta.badge}>
            {blueprint.industry}
          </Badge>
          <Badge variant="outline" className={complexityMeta.badge}>
            <span
              className={cn("size-1.5 rounded-full", complexityMeta.dot)}
              aria-hidden
            />
            {blueprint.complexity}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ListChecks className="size-3.5" aria-hidden />
              <span>Features</span>
            </div>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
              {blueprint.features.length}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              <span>Timeline</span>
            </div>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
              {blueprint.timeline}
            </p>
          </div>
        </div>

        {/* Tech stack preview */}
        <div className="space-y-1 text-xs">
          <TechRow label="Frontend" value={blueprint.techStack.frontend} />
          <TechRow label="Backend" value={blueprint.techStack.backend} />
          <TechRow label="Database" value={blueprint.techStack.database} />
        </div>

        {/* CTAs */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onView(blueprint)}
          >
            <FolderTree className="size-3.5" aria-hidden />
            View Architecture
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onGenerate(blueprint)}
          >
            <Rocket className="size-3.5" aria-hidden />
            Generate Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface TechRowProps {
  label: string;
  value: string;
}

function TechRow({ label, value }: TechRowProps): React.JSX.Element {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate font-medium text-foreground" title={value}>
        {value}
      </span>
    </div>
  );
}

interface MethodBadgeProps {
  method: HttpMethod;
  className?: string;
}

function MethodBadge({
  method,
  className,
}: MethodBadgeProps): React.JSX.Element {
  const meta = METHOD_META[method];
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-16 justify-center font-mono text-[10px]",
        meta.badge,
        className,
      )}
    >
      {method}
    </Badge>
  );
}

interface CopyButtonProps {
  label: string;
  text: string;
  onCopied?: () => void;
  onFailed?: () => void;
  className?: string;
}

function CopyButton({
  label,
  text,
  onCopied,
  onFailed,
  className,
}: CopyButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      onCopied?.();
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      onFailed?.();
    }
  }, [text, onCopied, onFailed]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-1.5", className)}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}

interface ArchitectureDialogProps {
  blueprint: Blueprint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopySuccess: (label: string) => void;
  onCopyFail: () => void;
}

function ArchitectureDialog({
  blueprint,
  open,
  onOpenChange,
  onCopySuccess,
  onCopyFail,
}: ArchitectureDialogProps): React.JSX.Element {
  if (!blueprint) {
    // Render a closed dialog shell so Radix animations behave correctly.
    return <Dialog open={open} onOpenChange={onOpenChange} />;
  }

  const Icon = blueprint.icon;
  const industryMeta = INDUSTRY_META[blueprint.industry];
  const complexityMeta = COMPLEXITY_META[blueprint.complexity];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 p-0 sm:max-w-3xl">
        {/* Header */}
        <DialogHeader className="flex-row items-start gap-3 border-b p-6 text-left">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border",
              industryMeta.badge,
            )}
            aria-hidden
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg">{blueprint.name}</DialogTitle>
            <DialogDescription className="mt-1 text-xs leading-relaxed">
              {blueprint.description}
            </DialogDescription>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={industryMeta.badge}>
                {blueprint.industry}
              </Badge>
              <Badge variant="outline" className={complexityMeta.badge}>
                <span
                  className={cn("size-1.5 rounded-full", complexityMeta.dot)}
                  aria-hidden
                />
                {blueprint.complexity}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CalendarDays className="size-3" aria-hidden />
                {blueprint.timeline}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <ListChecks className="size-3" aria-hidden />
                {blueprint.features.length} features
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs body */}
        <div className="flex max-h-[calc(90vh-9rem)] flex-col overflow-hidden">
          <Tabs defaultValue="architecture" className="flex flex-1 flex-col gap-0">
            <div className="border-b px-4 pt-3">
              <TabsList className="bg-transparent">
                <TabsTrigger value="architecture" className="gap-1.5">
                  <FolderTree className="size-3.5" aria-hidden />
                  Architecture
                </TabsTrigger>
                <TabsTrigger value="api" className="gap-1.5">
                  <Server className="size-3.5" aria-hidden />
                  API Endpoints
                </TabsTrigger>
                <TabsTrigger value="deployment" className="gap-1.5">
                  <Rocket className="size-3.5" aria-hidden />
                  Deployment
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Architecture tab */}
            <TabsContent
              value="architecture"
              className="flex-1 overflow-hidden p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Folder Structure
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Turborepo monorepo layout — apps, packages, services, infra.
                  </p>
                </div>
                <CopyButton
                  label="Copy tree"
                  text={blueprint.architecture}
                  onCopied={() => onCopySuccess("folder tree")}
                  onFailed={onCopyFail}
                />
              </div>
              <pre className="max-h-[55vh] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
                <code className="font-mono text-foreground">
                  {blueprint.architecture}
                </code>
              </pre>

              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-foreground">
                  Features ({blueprint.features.length})
                </h4>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {blueprint.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 size-3 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-hidden
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            {/* API tab */}
            <TabsContent
              value="api"
              className="flex-1 overflow-y-auto p-4"
            >
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-foreground">
                  API Endpoints ({blueprint.endpoints.length})
                </h4>
                <p className="text-xs text-muted-foreground">
                  REST surface — versioned under{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                    /api/v1
                  </code>
                  .
                </p>
              </div>
              <ul className="space-y-2">
                {blueprint.endpoints.map((ep) => (
                  <li
                    key={`${ep.method}-${ep.path}`}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3"
                  >
                    <MethodBadge method={ep.method} />
                    <div className="min-w-0 flex-1">
                      <code className="block break-all font-mono text-xs font-medium text-foreground">
                        {ep.path}
                      </code>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ep.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>

            {/* Deployment tab */}
            <TabsContent
              value="deployment"
              className="flex-1 overflow-y-auto p-4"
            >
              {/* Tech stack grid */}
              <div className="mb-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Layers className="size-3.5" aria-hidden />
                  Tech Stack
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <StackCell label="Frontend" value={blueprint.techStack.frontend} />
                  <StackCell label="Backend" value={blueprint.techStack.backend} />
                  <StackCell label="Database" value={blueprint.techStack.database} />
                  <StackCell label="Auth" value={blueprint.techStack.auth} />
                  <StackCell
                    label="Deployment"
                    value={blueprint.techStack.deployment}
                    className="sm:col-span-2"
                  />
                </div>
              </div>

              {/* Auth strategy */}
              <div className="mb-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  Auth Strategy
                </h4>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                  <p className="text-xs leading-relaxed text-foreground">
                    {blueprint.authStrategy}
                  </p>
                </div>
              </div>

              {/* Deploy guide */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Rocket className="size-3.5" aria-hidden />
                      Deployment Guide
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {blueprint.timeline} build · {blueprint.complexity} tier
                    </p>
                  </div>
                  <CopyButton
                    label="Copy guide"
                    text={blueprint.deploymentGuide}
                    onCopied={() => onCopySuccess("deploy guide")}
                    onFailed={onCopyFail}
                  />
                </div>
                <pre className="overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
                  <code className="font-mono text-foreground">
                    {blueprint.deploymentGuide}
                  </code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t p-4 sm:justify-between">
          <span className="text-xs text-muted-foreground">
            Blueprint ID:{" "}
            <code className="font-mono">{blueprint.id}</code>
          </span>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StackCellProps {
  label: string;
  value: string;
  className?: string;
}

function StackCell({
  label,
  value,
  className,
}: StackCellProps): React.JSX.Element {
  return (
    <div className={cn("rounded-lg border bg-muted/30 px-3 py-2", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyBlueprints — main exported component
// ═══════════════════════════════════════════════════════════════════════

export function RoyBlueprints(): React.JSX.Element {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("blueprints");
  void data;

  const { toast } = useToast();

  const [search, setSearch] = useState<string>("");
  const [industry, setIndustry] = useState<IndustryFilter>("All");
  const [active, setActive] = useState<Blueprint | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // ─── Aggregate stats (memoized once — depends only on BLUEPRINTS) ────
  const stats = useMemo(() => {
    const total = BLUEPRINTS.length;
    const totalFeatures = BLUEPRINTS.reduce(
      (sum, bp) => sum + bp.features.length,
      0,
    );
    const totalWeeks = BLUEPRINTS.reduce(
      (sum, bp) => sum + bp.timelineWeeks,
      0,
    );
    return {
      total,
      avgFeatures: Math.round(totalFeatures / Math.max(total, 1)),
      avgWeeks: Math.round(totalWeeks / Math.max(total, 1)),
    };
  }, []);

  // ─── Filter pipeline (memoized on every input) ──────────────────────
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BLUEPRINTS.filter((bp) => {
      if (industry !== "All" && bp.industry !== industry) return false;
      if (q.length > 0 && !bp.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, industry]);

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleView = useCallback((bp: Blueprint) => {
    setActive(bp);
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Defer clearing so the close animation runs against the right data.
      window.setTimeout(() => setActive(null), 200);
    }
  }, []);

  const handleGenerate = useCallback(
    (bp: Blueprint) => {
      toast({
        title: "Scaffolding project…",
        description: `${bp.name} blueprint is being generated into a new monorepo.`,
      });
    },
    [toast],
  );

  const handleCopySuccess = useCallback(
    (label: string) => {
      toast({
        title: "Copied to clipboard",
        description: `The ${label} has been copied.`,
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

  const hasFilters = search.trim().length > 0 || industry !== "All";

  const resetFilters = useCallback(() => {
    setSearch("");
    setIndustry("All");
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Boxes className="size-5 text-primary" aria-hidden />
          Roy Blueprints
        </CardTitle>
        <CardDescription>
          {stats.total} application blueprints · avg {stats.avgFeatures}{" "}
          features · avg {stats.avgWeeks} weeks build
        </CardDescription>
        <CardAction>
          <BackendLiveBadge module="blueprints" loading={loading} error={error} />
          <Badge variant="secondary" className="gap-1">
            <Boxes className="size-3" aria-hidden />
            {visible.length} shown
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {/* ─── Toolbar: search + reset ─────────────────────────────── */}
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
              placeholder="Search blueprints by name…"
              className="pl-9"
              aria-label="Search blueprints"
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

        {/* ─── Industry filter chips ───────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter by industry"
        >
          {INDUSTRY_ORDER.map((ind) => {
            const isActive = industry === ind;
            const meta = ind === "All" ? null : INDUSTRY_META[ind];
            return (
              <button
                key={ind}
                type="button"
                onClick={() => setIndustry(ind)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? meta
                      ? meta.chipActive
                      : "border-foreground/30 bg-foreground/10 text-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {ind}
              </button>
            );
          })}
        </div>

        {/* ─── Grid ──────────────────────────────────────────────── */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((bp) => (
              <BlueprintCard
                key={bp.id}
                blueprint={bp}
                onView={handleView}
                onGenerate={handleGenerate}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">No blueprints found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or industry filter.
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw className="size-3.5" aria-hidden />
                Reset filters
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <ArchitectureDialog
        blueprint={active}
        open={dialogOpen}
        onOpenChange={handleClose}
        onCopySuccess={handleCopySuccess}
        onCopyFail={handleCopyFail}
      />
    </Card>
  );
}
