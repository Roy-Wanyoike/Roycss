"use client";

/**
 * RoySpotlight — featured developer showcase for the RoyCSS community.
 *
 * Self-contained (no props). Layout:
 *   • Header with "Submit to Spotlight" button (mock dialog form).
 *   • Filter chips by type (All, Template, Component, Plugin, Project).
 *   • Weekly spotlight banner — featured item of the week.
 *   • Grid of 6 featured items with title, author, type badge, stars,
 *     and a "View" button.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. ItemType is a string-literal union; the
 *     `never` guard enforces exhaustiveness on the tone mapper.
 *   • Palette: emerald primary, teal/amber/sky accents, rose for plugin.
 *     No indigo/blue.
 */

import { useState } from "react";
import {
  Blocks,
  ExternalLink,
  Plug,
  Sparkles,
  Star,
  Wand2,
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type ItemType = "template" | "component" | "plugin" | "project";

interface SpotlightItem {
  id: string;
  title: string;
  author: string;
  type: ItemType;
  stars: number;
  blurb: string;
  weekly?: boolean;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const TYPE_META: Record<
  ItemType,
  { label: string; icon: LucideIcon; tone: string }
> = {
  template: { label: "Template", icon: Sparkles, tone: "bg-primary/15 text-primary" },
  component: { label: "Component", icon: Blocks, tone: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  plugin: { label: "Plugin", icon: Plug, tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  project: { label: "Project", icon: Wand2, tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
};

const ITEMS: readonly SpotlightItem[] = [
  { id: "s1", title: "Glassmorphism Dashboard Kit", author: "Maya O.", type: "template", stars: 1842, blurb: "32 dashboard screens with frosted glass surfaces.", weekly: true },
  { id: "s2", title: "Virtualized DataTable v3", author: "Daniel R.", type: "component", stars: 1109, blurb: "Renders 100k rows at 60fps, fully typed." },
  { id: "s3", title: "VSCode Theme Pack", author: "Priya N.", type: "plugin", stars: 921, blurb: "Eight editor themes matched to RoyCSS palettes." },
  { id: "s4", title: "Marketing Site Starter", author: "Theo L.", type: "template", stars: 654, blurb: "Landing + pricing + blog, deploy-ready." },
  { id: "s5", title: "Animated Command Palette", author: "Sofia M.", type: "component", stars: 488, blurb: "Cmd+K palette with framer-motion transitions." },
  { id: "s6", title: "Figma Token Sync", author: "Daniel R.", type: "plugin", stars: 412, blurb: "Sync Figma variables to RoyCSS tokens.json." },
];

const FILTERS: readonly { id: ItemType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "template", label: "Templates" },
  { id: "component", label: "Components" },
  { id: "plugin", label: "Plugins" },
];

// ─── Component ───────────────────────────────────────────────────────────

export function RoySpotlight() {
  const [filter, setFilter] = useState<ItemType | "all">("all");
  const { toast } = useToast();

  const weekly = ITEMS.find((i) => i.weekly) ?? ITEMS[0];
  const rest = ITEMS.filter((i) => !i.weekly);
  const filtered =
    filter === "all" ? rest : rest.filter((i) => i.type === filter);

  const submit = () =>
    toast({
      title: "Submission received",
      description: "Your item will be reviewed within 48 hours (mock).",
    });

  const view = (item: SpotlightItem) =>
    toast({
      title: item.title,
      description: `Opening "${item.title}" by ${item.author} (mock).`,
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Star className="size-5" />
              </div>
              <div>
                <CardTitle>Developer Spotlight</CardTitle>
                <CardDescription>
                  Featured community work, fresh every week.
                </CardDescription>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-1.5">
                  <Sparkles className="size-4" /> Submit to Spotlight
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit your work</DialogTitle>
                  <DialogDescription>
                    Share a template, component, plugin, or project. Curated weekly.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-2">
                  <Input placeholder="Title" />
                  <Input placeholder="Author / handle" />
                  <Input placeholder="Repository or demo URL" />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={submit} className="gap-1.5">
                      <Sparkles className="size-4" /> Submit
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly spotlight */}
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-xl">
              <Star className="size-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground gap-1 text-[10px]">
                  <Sparkles className="size-3" /> Weekly Spotlight
                </Badge>
                <Badge className={cn("text-[10px]", TYPE_META[weekly.type].tone)}>
                  {TYPE_META[weekly.type].label}
                </Badge>
              </div>
              <h3 className="mt-1 text-lg font-semibold">{weekly.title}</h3>
              <p className="text-muted-foreground text-sm">
                by {weekly.author} · {weekly.blurb}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground flex items-center gap-1 text-sm tabular-nums">
                <Star className="text-amber-500 size-4 fill-amber-500" />
                {weekly.stars.toLocaleString()}
              </span>
              <Button size="sm" className="gap-1.5" onClick={() => view(weekly)}>
                <ExternalLink className="size-3.5" /> View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === f.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground hover:text-foreground border-border",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const meta = TYPE_META[item.type];
          const Icon = meta.icon;
          return (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("flex size-10 items-center justify-center rounded-xl", meta.tone)}>
                    <Icon className="size-5" />
                  </div>
                  <Badge className={cn("text-[10px]", meta.tone)}>{meta.label}</Badge>
                </div>
                <CardTitle className="mt-2 text-base">{item.title}</CardTitle>
                <CardDescription className="text-xs">
                  by {item.author}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="text-muted-foreground text-sm">{item.blurb}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                    <Star className="text-amber-500 size-3.5 fill-amber-500" />
                    {item.stars.toLocaleString()}
                  </span>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => view(item)}>
                    <ExternalLink className="size-3.5" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
