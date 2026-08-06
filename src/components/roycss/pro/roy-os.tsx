"use client";

/**
 * RoyOS — unified workspace dashboard.
 *
 * A central hub connecting all RoyCSS products. 12 product tiles in
 * a grid (icon + name + status), Quick Actions sidebar (New Project,
 * Open Studio, Run AI, Browse Docs, Deploy), recent activity feed
 * (5 items), and a global search bar that filters tiles live.
 *
 * Palette: emerald primary, teal/amber/violet accents — no indigo /
 * blue. TS strict, zero `any`. Self-contained: all data is local.
 */

import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  Calendar,
  Command,
  FileText,
  FolderPlus,
  GitFork,
  GraduationCap,
  Layers,
  LayoutGrid,
  type LucideIcon,
  Play,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Terminal,
  Wrench,
  Zap,
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type TileStatus = "ready" | "beta" | "coming-soon";

interface Tile {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: TileStatus;
  accent: string;
  category: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}

interface ActivityItem {
  id: string;
  text: string;
  meta: string;
  at: string;
  icon: LucideIcon;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const TILES: Tile[] = [
  { id: "studio", name: "Visual Studio", description: "Drag-and-drop page builder", icon: LayoutGrid, status: "ready", accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", category: "Build" },
  { id: "ai", name: "RoyAI", description: "CSS assistant & generator", icon: Bot, status: "ready", accent: "bg-teal-500/15 text-teal-600 dark:text-teal-400", category: "AI" },
  { id: "agents", name: "Roy Agents", description: "8 autonomous audit agents", icon: Wrench, status: "ready", accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400", category: "AI" },
  { id: "governance", name: "Governance", description: "Design system approvals", icon: ShieldCheck, status: "ready", accent: "bg-rose-500/15 text-rose-600 dark:text-rose-400", category: "Enterprise" },
  { id: "audit", name: "Audit Center", description: "Cross-project scoring", icon: BarChart3, status: "ready", accent: "bg-teal-500/15 text-teal-600 dark:text-teal-400", category: "Enterprise" },
  { id: "observatory", name: "Observatory", description: "Production monitoring", icon: Activity, status: "ready", accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", category: "Cloud" },
  { id: "bundle", name: "Bundle Optimizer", description: "Asset size + dead CSS", icon: Boxes, status: "beta", accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400", category: "Cloud" },
  { id: "profiler", name: "Profiler", description: "Render + memory traces", icon: Zap, status: "beta", accent: "bg-rose-500/15 text-rose-600 dark:text-rose-400", category: "Cloud" },
  { id: "sandbox", name: "Sandbox", description: "Live HTML/CSS/JS editor", icon: Play, status: "ready", accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", category: "Build" },
  { id: "academy", name: "Academy", description: "Learning paths + certs", icon: GraduationCap, status: "ready", accent: "bg-teal-500/15 text-teal-600 dark:text-teal-400", category: "Learn" },
  { id: "mentor", name: "RoyMentor", description: "AI tutor with challenges", icon: Sparkles, status: "ready", accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400", category: "Learn" },
  { id: "blueprints", name: "Blueprints", description: "App architectures", icon: Building2, status: "ready", accent: "bg-rose-500/15 text-rose-600 dark:text-rose-400", category: "Build" },
];

const QUICK_ACTIONS: QuickAction[] = [
  { id: "new-project", label: "New Project", icon: FolderPlus, shortcut: "⌘N" },
  { id: "open-studio", label: "Open Studio", icon: LayoutGrid, shortcut: "⌘O" },
  { id: "run-ai", label: "Run AI", icon: Bot, shortcut: "⌘K" },
  { id: "browse-docs", label: "Browse Docs", icon: FileText, shortcut: "⌘/" },
  { id: "deploy", label: "Deploy", icon: Rocket, shortcut: "⌘D" },
];

const ACTIVITY: ActivityItem[] = [
  { id: "ac1", text: "Approved token change — --space-3", meta: "Maya · Governance", at: "2m ago", icon: ShieldCheck },
  { id: "ac2", text: "Generated glass-card effect", meta: "RoyAI", at: "18m ago", icon: Bot },
  { id: "ac3", text: "Audited Admin Console — 84 perf", meta: "Audit Center", at: "1h ago", icon: BarChart3 },
  { id: "ac4", text: "Completed 'Flexbox vs Grid' lesson", meta: "Academy", at: "3h ago", icon: GraduationCap },
  { id: "ac5", text: "Deployed marketing site v2.4.1", meta: "Deploy", at: "5h ago", icon: Rocket },
];

const STATUS_BADGE: Record<TileStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  beta: { label: "Beta", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  "coming-soon": { label: "Soon", className: "bg-muted text-muted-foreground" },
};

// ─── Component ───────────────────────────────────────────────────────────

export function RoyOS() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TILES;
    return TILES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
  }, [search]);

  const fireAction = useCallback(
    (action: QuickAction) => {
      toast({
        title: action.label,
        description: action.shortcut ? `Triggered via ${action.shortcut}` : "Action triggered.",
      });
    },
    [toast],
  );

  const openTile = useCallback(
    (tile: Tile) => {
      setOpenId(tile.id);
      toast({ title: `Opening ${tile.name}`, description: tile.description });
    },
    [toast],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="flex flex-col gap-4">
        <Card className="py-4">
          <CardHeader className="px-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
                <Command className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold">RoyOS</p>
                <p className="text-muted-foreground text-[10px]">Workspace v2.4.1</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 px-2">
            <p className="text-muted-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
              Quick Actions
            </p>
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => fireAction(a)}
                  className="hover:bg-accent flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition"
                >
                  <Icon className="text-muted-foreground size-4" />
                  <span className="flex-1 text-left">{a.label}</span>
                  {a.shortcut && (
                    <kbd className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                      {a.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
            <div className="mt-2 border-t pt-2">
              <button
                type="button"
                onClick={() => toast({ title: "Settings", description: "Workspace preferences." })}
                className="hover:bg-accent flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition"
              >
                <Settings className="text-muted-foreground size-4" />
                <span>Settings</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="size-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-2">
            {ACTIVITY.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-accent">
                  <div className="bg-muted text-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{a.text}</p>
                    <p className="text-muted-foreground truncate text-[11px]">{a.meta}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-[10px]">{a.at}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </aside>

      {/* Main */}
      <div className="flex flex-col gap-6">
        {/* Search header */}
        <Card className="py-4">
          <CardHeader className="px-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                  <Layers className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">RoyOS Dashboard</CardTitle>
                  <CardDescription>
                    {filtered.length} of {TILES.length} products · {TILES.filter(t => t.status === "ready").length} ready
                  </CardDescription>
                </div>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  className="h-9 pl-9"
                  aria-label="Search products"
                />
                <kbd className="bg-muted text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[10px]">
                  ⌘K
                </kbd>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tile grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tile) => {
            const Icon = tile.icon;
            const badge = STATUS_BADGE[tile.status];
            const isOpen = openId === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => openTile(tile)}
                className={cn(
                  "group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition hover:shadow-md",
                  isOpen ? "border-primary ring-primary/20 ring-2" : "hover:border-primary/40",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className={cn("flex size-11 items-center justify-center rounded-lg", tile.accent)}>
                    <Icon className="size-5" />
                  </div>
                  <Badge className={badge.className}>{badge.label}</Badge>
                </div>
                <div>
                  <p className="font-semibold">{tile.name}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{tile.description}</p>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-[10px]">
                  <span className="rounded-full bg-muted px-2 py-0.5">{tile.category}</span>
                  <span className="ml-auto inline-flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    Open <Terminal className="size-3" />
                  </span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                No products match &ldquo;{search}&rdquo;.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer status strip */}
        <Card className="py-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 pt-0">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-emerald-500 size-2 animate-pulse rounded-full" />
                All systems operational
              </span>
              <span className="text-muted-foreground">12 products · 4 categories</span>
              <span className="text-muted-foreground">Latency 38ms</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground">Synced {new Date().toLocaleTimeString()}</span>
              <GitFork className="text-muted-foreground ml-2 size-3.5" />
              <span className="text-muted-foreground">main · a1b2c3d</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
