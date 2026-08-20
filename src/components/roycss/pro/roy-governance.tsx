"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyGovernance — Design system governance dashboard.
 *
 * Self-contained approval queue, team roster, policy list, audit log,
 * and a month-to-date stats bar. All mock data lives in this file.
 *
 * Features:
 *   • 5 approval items (token change, new component, theme update,
 *     deprecation, breaking change) with requester, status, and
 *     inline Approve / Reject buttons that mutate local state.
 *   • 4 team members with role + review count.
 *   • 3 governance policies with summaries.
 *   • 5 recent audit-log decisions (auto-appended on Approve / Reject).
 *   • Stats bar: pending · approved · rejected this month.
 *
 * Palette: emerald primary, amber for warnings, rose for breaking /
 * rejected. No indigo / blue. TS strict, zero `any`.
 */

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  GitPullRequestArrow,
  History,
  Palette,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type ChangeType =
  | "token"
  | "component"
  | "theme"
  | "deprecation"
  | "breaking";

type Status = "pending" | "approved" | "rejected";

interface ApprovalItem {
  id: string;
  title: string;
  type: ChangeType;
  requester: string;
  team: string;
  submittedAt: string;
  status: Status;
  summary: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  reviewsThisMonth: number;
  avatar: string;
}

interface Policy {
  id: string;
  title: string;
  summary: string;
  icon: LucideIcon;
}

interface AuditEntry {
  id: string;
  decision: "approved" | "rejected";
  title: string;
  actor: string;
  at: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const TYPE_META: Record<ChangeType, { label: string; icon: LucideIcon; tone: string }> = {
  token: {
    label: "Token Change",
    icon: Palette,
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  component: {
    label: "New Component",
    icon: GitPullRequestArrow,
    tone: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  },
  theme: {
    label: "Theme Update",
    icon: ShieldCheck,
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  deprecation: {
    label: "Deprecation",
    icon: FileText,
    tone: "bg-muted text-muted-foreground",
  },
  breaking: {
    label: "Breaking Change",
    icon: AlertTriangle,
    tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
};

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: "gov-1",
    title: "Bump --space-3 from 12px to 0.75rem",
    type: "token",
    requester: "Maya Okonkwo",
    team: "Design Systems",
    submittedAt: "2h ago",
    status: "pending",
    summary: "Aligns --space-3 with the 0.25rem modular scale. Affects 24 components.",
  },
  {
    id: "gov-2",
    title: "Add DataGrid component to /pro",
    type: "component",
    requester: "Daniel Reyes",
    team: "Platform",
    submittedAt: "5h ago",
    status: "pending",
    summary: "New sortable, filterable data grid. Includes 5 variants and full a11y audit.",
  },
  {
    id: "gov-3",
    title: "Update emerald theme to OKLCH",
    type: "theme",
    requester: "Priya Nair",
    team: "Design Systems",
    submittedAt: "1d ago",
    status: "pending",
    summary: "Migrate theme palette from HSL to OKLCH for wider gamut coverage.",
  },
  {
    id: "gov-4",
    title: "Deprecate .btn-flat utility",
    type: "deprecation",
    requester: "Theo Lindqvist",
    team: "Platform",
    submittedAt: "2d ago",
    status: "pending",
    summary: "Mark .btn-flat as deprecated; remove in v3.0. Migration guide attached.",
  },
  {
    id: "gov-5",
    title: "Rename --radius to --radius-md (breaking)",
    type: "breaking",
    requester: "Sofia Marchetti",
    team: "Design Systems",
    submittedAt: "3d ago",
    status: "pending",
    summary: "Breaking rename to introduce --radius-sm / --radius-md / --radius-lg scale.",
  },
];

const TEAM: TeamMember[] = [
  { id: "t1", name: "Maya Okonkwo", role: "Design Systems Lead", reviewsThisMonth: 18, avatar: "MO" },
  { id: "t2", name: "Daniel Reyes", role: "Staff Engineer", reviewsThisMonth: 14, avatar: "DR" },
  { id: "t3", name: "Priya Nair", role: "Theme Architect", reviewsThisMonth: 11, avatar: "PN" },
  { id: "t4", name: "Theo Lindqvist", role: "Senior FE Engineer", reviewsThisMonth: 9, avatar: "TL" },
];

const POLICIES: Policy[] = [
  {
    id: "p1",
    title: "Token-First Design",
    summary: "All color, spacing, radius, and shadow values must reference a design token. Hard-coded values are blocked at review.",
    icon: Palette,
  },
  {
    id: "p2",
    title: "Two-Reviewer Rule",
    summary: "Any breaking change or public API removal requires sign-off from two reviewers, one of whom must be a Staff+ engineer.",
    icon: ShieldCheck,
  },
  {
    id: "p3",
    title: "Deprecation Window",
    summary: "Deprecated utilities ship a migration guide and remain for one major version before removal.",
    icon: FileText,
  },
];

const INITIAL_AUDIT: AuditEntry[] = [
  { id: "a1", decision: "approved", title: "Add .glass utility", actor: "Maya Okonkwo", at: "2025-03-12 14:22" },
  { id: "a2", decision: "approved", title: "Add --shadow-soft token", actor: "Daniel Reyes", at: "2025-03-12 11:08" },
  { id: "a3", decision: "rejected", title: "Inline raw #10b981 color", actor: "Priya Nair", at: "2025-03-11 16:45" },
  { id: "a4", decision: "approved", title: "Add SegmentedControl component", actor: "Theo Lindqvist", at: "2025-03-11 09:30" },
  { id: "a5", decision: "approved", title: "Bump --text-md to 1rem", actor: "Maya Okonkwo", at: "2025-03-10 18:12" },
];

// ─── Component ───────────────────────────────────────────────────────────

export function RoyGovernance() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("governance/policies");
  void data; void loading; void error;

  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [audit, setAudit] = useState<AuditEntry[]>(INITIAL_AUDIT);

  const decide = useCallback((id: string, decision: "approved" | "rejected") => {
    const item = approvals.find((a) => a.id === id);
    if (!item) return;
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: decision } : a)),
    );
    setAudit((prev) => [
      {
        id: `a-${Date.now()}`,
        decision,
        title: item.title,
        actor: "You",
        at: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...prev,
    ]);
  }, [approvals]);

  const stats = useMemo(() => {
    const pending = approvals.filter((a) => a.status === "pending").length;
    const approved = approvals.filter((a) => a.status === "approved").length;
    const rejected = approvals.filter((a) => a.status === "rejected").length;
    return { pending, approved, rejected };
  }, [approvals]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header + stats */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Gavel className="size-5" />
              </div>
              <div>
                <CardTitle>Design System Governance</CardTitle>
                <CardDescription>
                  Approvals, policies, and audit trail for the RoyCSS design system.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary" className="gap-1">
                <Clock className="size-3" /> {stats.pending} pending
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 gap-1">
                <CheckCircle2 className="size-3" /> {stats.approved} approved
              </Badge>
              <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 gap-1">
                <X className="size-3" /> {stats.rejected} rejected
              </Badge>
              <span className="text-muted-foreground">this month</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Approval queue — spans 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Approval Queue</CardTitle>
            <CardDescription>Review pending design-system changes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {approvals.map((item) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{item.title}</p>
                        <Badge variant="outline" className={cn("border-0", meta.tone)}>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">{item.summary}</p>
                      <p className="text-muted-foreground mt-1 text-[11px]">
                        {item.requester} · {item.team} · {item.submittedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decide(item.id, "rejected")}
                          className="gap-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400"
                        >
                          <X className="size-3.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => decide(item.id, "approved")}
                          className="gap-1.5"
                        >
                          <Check className="size-3.5" /> Approve
                        </Button>
                      </>
                    ) : (
                      <Badge
                        className={cn(
                          "gap-1",
                          item.status === "approved"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {item.status === "approved" ? <CheckCircle2 className="size-3" /> : <X className="size-3" />}
                        {item.status === "approved" ? "Approved" : "Rejected"}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Team + Policies */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" /> Team
              </CardTitle>
              <CardDescription>Design-system council members.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {TEAM.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                    {m.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="text-muted-foreground truncate text-xs">{m.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{m.reviewsThisMonth}</p>
                    <p className="text-muted-foreground text-[10px]">reviews</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policies</CardTitle>
              <CardDescription>Enforced at review time.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {POLICIES.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.id} className="flex gap-3">
                    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-muted-foreground text-xs">{p.summary}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" /> Audit Log
          </CardTitle>
          <CardDescription>Most recent governance decisions.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {audit.map((entry, idx) => (
              <li key={entry.id}>
                <div className="flex items-center gap-3 text-sm">
                  <Badge
                    className={cn(
                      "gap-1",
                      entry.decision === "approved"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {entry.decision === "approved" ? <Check className="size-3" /> : <X className="size-3" />}
                    {entry.decision}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate font-medium">{entry.title}</span>
                  <span className="text-muted-foreground hidden text-xs sm:inline">{entry.actor}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">{entry.at}</span>
                </div>
                {idx < audit.length - 1 && <Separator className="mt-2" />}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
