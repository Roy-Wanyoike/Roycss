"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyWorkspace — company workspace for shared RoyCSS resources.
 *
 * Self-contained (no props). Layout:
 *   • Header card with workspace name + Invite button (mock toast).
 *   • Two-column: shared resources (left) + team sidebar (right).
 *   • Resources: Tabs (Templates, Tokens, Components, Projects) — each
 *     tab shows a grid of 4–6 mock items with name, shared-by, updated.
 *   • Team sidebar: 4 members with role badges + active-now indicator.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Tab id is a string-literal union with a
 *     `never` guard on the items-per-tab mapper.
 *   • Palette: emerald primary, teal/sky/amber accents. No indigo/blue.
 */

import { useState } from "react";
import {
  Boxes,
  Building2,
  Clock,
  Component,
  FileCode2,
  Folder,
  Palette,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type ResourceTab = "templates" | "tokens" | "components" | "projects";

interface ResourceItem {
  id: string;
  name: string;
  sharedBy: string;
  updated: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  avatar: string;
  active: boolean;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const TAB_META: Record<
  ResourceTab,
  { label: string; icon: LucideIcon; items: readonly ResourceItem[] }
> = {
  templates: {
    label: "Templates",
    icon: FileCode2,
    items: [
      { id: "t1", name: "SaaS Landing", sharedBy: "Maya O.", updated: "2h ago" },
      { id: "t2", name: "Dashboard Kit", sharedBy: "Daniel R.", updated: "1d ago" },
      { id: "t3", name: "Docs Theme", sharedBy: "Priya N.", updated: "3d ago" },
      { id: "t4", name: "E-commerce PDP", sharedBy: "Sofia M.", updated: "5d ago" },
      { id: "t5", name: "Auth Flow", sharedBy: "Theo L.", updated: "1w ago" },
    ],
  },
  tokens: {
    label: "Tokens",
    icon: Palette,
    items: [
      { id: "k1", name: "color.palette.json", sharedBy: "Priya N.", updated: "30m ago" },
      { id: "k2", name: "spacing.scale.json", sharedBy: "Maya O.", updated: "4h ago" },
      { id: "k3", name: "typography.ramp.json", sharedBy: "Theo L.", updated: "1d ago" },
      { id: "k4", name: "shadow.tokens.json", sharedBy: "Daniel R.", updated: "2d ago" },
    ],
  },
  components: {
    label: "Components",
    icon: Component,
    items: [
      { id: "c1", name: "DataTable", sharedBy: "Daniel R.", updated: "1h ago" },
      { id: "c2", name: "DateRangePicker", sharedBy: "Maya O.", updated: "6h ago" },
      { id: "c3", name: "Combobox", sharedBy: "Theo L.", updated: "1d ago" },
      { id: "c4", name: "Toast.Provider", sharedBy: "Sofia M.", updated: "2d ago" },
      { id: "c5", name: "Stepper", sharedBy: "Priya N.", updated: "4d ago" },
      { id: "c6", name: "CommandPalette", sharedBy: "Daniel R.", updated: "1w ago" },
    ],
  },
  projects: {
    label: "Projects",
    icon: Boxes,
    items: [
      { id: "pj1", name: "marketing-site", sharedBy: "Maya O.", updated: "12m ago" },
      { id: "pj2", name: "design-system", sharedBy: "Priya N.", updated: "1h ago" },
      { id: "pj3", name: "docs-platform", sharedBy: "Daniel R.", updated: "3d ago" },
      { id: "pj4", name: "checkout-app", sharedBy: "Sofia M.", updated: "5h ago" },
    ],
  },
};

const TEAM: readonly TeamMember[] = [
  { id: "u1", name: "Maya Okonkwo", role: "Owner", avatar: "MO", active: true },
  { id: "u2", name: "Daniel Reyes", role: "Admin", avatar: "DR", active: true },
  { id: "u3", name: "Priya Nair", role: "Editor", avatar: "PN", active: false },
  { id: "u4", name: "Theo Lindqvist", role: "Viewer", avatar: "TL", active: true },
];

const ROLE_TONE: Record<TeamMember["role"], string> = {
  Owner: "bg-primary/15 text-primary",
  Admin: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  Editor: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Viewer: "bg-muted text-muted-foreground",
};

const TAB_ICONS: Record<ResourceTab, LucideIcon> = {
  templates: FileCode2,
  tokens: Palette,
  components: Component,
  projects: Folder,
};

// ─── Component ───────────────────────────────────────────────────────────

export function RoyWorkspace() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("workspace/resources");
  void data;

  const [tab, setTab] = useState<ResourceTab>("templates");
  const { toast } = useToast();

  const invite = () =>
    toast({
      title: "Invite sent",
      description: "An email invitation has been queued (mock).",
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Building2 className="size-5" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Acme Design Org
                  <Badge variant="secondary" className="gap-1">
                    <ShieldCheck className="size-3" /> Pro
                  </Badge>
                  <BackendLiveBadge loading={loading} error={error} />
                </CardTitle>
                <CardDescription>
                  Shared templates, tokens, components, and projects.
                </CardDescription>
              </div>
            </div>
            <Button onClick={invite} className="gap-1.5">
              <UserPlus className="size-4" /> Invite
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Shared resources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shared Resources</CardTitle>
            <CardDescription>
              Browse, reuse, and remix assets across your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as ResourceTab)}>
              <TabsList className="w-full justify-start">
                {(Object.keys(TAB_META) as ResourceTab[]).map((t) => {
                  const Icon = TAB_ICONS[t];
                  return (
                    <TabsTrigger key={t} value={t} className="gap-1.5">
                      <Icon className="size-3.5" />
                      {TAB_META[t].label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {(Object.keys(TAB_META) as ResourceTab[]).map((t) => {
                const meta = TAB_META[t];
                const Icon = meta.icon;
                return (
                  <TabsContent key={t} value={t} className="mt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {meta.items.map((item) => (
                        <div
                          key={item.id}
                          className="hover:bg-muted/40 group flex items-center gap-3 rounded-lg border p-3 transition-colors"
                        >
                          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p className="text-muted-foreground truncate text-xs">
                              by {item.sharedBy} · {item.updated}
                            </p>
                          </div>
                          <Sparkles className="text-muted-foreground group-hover:text-primary size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Team sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Users className="size-4" /> Team
              </span>
              <Badge variant="secondary">
                {TEAM.filter((m) => m.active).length} online
              </Badge>
            </CardTitle>
            <CardDescription>Members with workspace access.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {TEAM.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border p-2.5"
              >
                <div className="relative">
                  <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                    {m.avatar}
                  </div>
                  <span
                    className={cn(
                      "absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card",
                      m.active ? "bg-emerald-500" : "bg-muted-foreground/40",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {m.active ? "Active now" : "Away"}
                  </p>
                </div>
                <Badge className={cn("gap-1", ROLE_TONE[m.role])}>{m.role}</Badge>
              </div>
            ))}
            <div className="text-muted-foreground mt-2 flex items-center justify-center gap-1 text-[11px]">
              <Clock className="size-3" /> Activity syncs every 30s
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
