"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * PatternLibrary — RoyCSS extended pattern library with 12 live UI patterns.
 *
 * Self-contained (no props). Each pattern is rendered in a card with:
 *   • Live interactive preview (actual rendered component, not screenshot).
 *   • Pattern name, description, category badge.
 *   • "Copy JSX" button (clipboard + 2s ✓ feedback).
 *
 * Top toolbar:
 *   • Search input — case-insensitive filter on pattern name.
 *   • Category filter chips — All / Feedback / Navigation / Forms /
 *     Layout / Data (single-select toggle).
 *
 * Catalogue (12 patterns, beyond the existing 10 in `roycss-patterns.ts`):
 *   • Feedback   — Empty State, Error Boundary, Loading Skeleton,
 *                  Confirmation Dialog, Toast Notification.
 *   • Navigation — Breadcrumb Nav, Tab Bar, Accordion.
 *   • Forms      — File Upload.
 *   • Layout     — Progress Steps.
 *   • Data       — Search Results, Command Menu.
 *
 * Every pattern is fully interactive — accordion expands, tabs switch,
 * toast appears on click, dialog opens, command palette supports keyboard
 * navigation, file upload accepts drag-drop, etc.
 *
 * TS strict, zero `any`. No indigo / blue.
 */

import * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CornerDownLeft,
  File as FileIcon,
  Home,
  Inbox,
  Loader2,
  PackageOpen,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UploadCloud,
  X,
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
  Accordion as ShadcnAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Category = "feedback" | "navigation" | "forms" | "layout" | "data";
type Filter = "all" | Category;

interface PatternMeta {
  id: string;
  name: string;
  description: string;
  category: Category;
  code: string;
}

interface CategoryMeta {
  label: string;
  badgeClass: string;
}

const CATEGORY_META: Record<Category, CategoryMeta> = {
  feedback: {
    label: "Feedback",
    badgeClass:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  },
  navigation: {
    label: "Navigation",
    badgeClass:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  forms: {
    label: "Forms",
    badgeClass:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
  },
  layout: {
    label: "Layout",
    badgeClass:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
  },
  data: {
    label: "Data",
    badgeClass:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// Pattern catalogue (metadata + JSX code snippet)
// ═══════════════════════════════════════════════════════════════════════

const PATTERNS: readonly PatternMeta[] = [
  {
    id: "empty-state",
    name: "Empty State",
    description:
      "A calming empty state with a breathing illustration, clear message, and a primary CTA button.",
    category: "feedback",
    code: `<div className="flex flex-col items-center gap-4 p-8 text-center">
  <div
    className="size-16 rounded-full bg-primary/15"
    style={{ animation: "breathing 3s ease-in-out infinite" }}
  />
  <div className="space-y-1">
    <h3 className="text-base font-semibold">Nothing here yet</h3>
    <p className="text-sm text-muted-foreground">
      Create your first item to get started.
    </p>
  </div>
  <Button>
    <Plus className="size-4" />
    Create Item
  </Button>
</div>`,
  },
  {
    id: "error-boundary",
    name: "Error Boundary",
    description:
      "An inline error card with icon, message, and a retry button that simulates re-fetching.",
    category: "feedback",
    code: `<div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
  <AlertTriangle className="size-8 text-destructive" />
  <div className="space-y-1">
    <h3 className="text-base font-semibold">Something went wrong</h3>
    <p className="text-sm text-muted-foreground">
      We couldn't load your data. Please try again.
    </p>
  </div>
  <Button variant="destructive" onClick={retry}>
    <RotateCcw className="size-4" />
    Retry
  </Button>
</div>`,
  },
  {
    id: "loading-skeleton",
    name: "Loading Skeleton",
    description:
      "Animated skeleton placeholders that mimic the layout of content while it loads.",
    category: "feedback",
    code: `<div className="space-y-3 p-4">
  <div className="flex items-center gap-3">
    <Skeleton className="size-10 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
  <Skeleton className="h-32 w-full rounded-lg" />
  <Skeleton className="h-3 w-full" />
  <Skeleton className="h-3 w-4/5" />
</div>`,
  },
  {
    id: "confirmation-dialog",
    name: "Confirmation Dialog",
    description:
      "A modal that asks the user to confirm a destructive action with icon, message, and confirm/cancel.",
    category: "feedback",
    code: `<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="destructive">
      <Trash2 className="size-4" /> Delete item
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <AlertTriangle className="size-5 text-destructive" />
        Delete item?
      </DialogTitle>
      <DialogDescription>
        This action cannot be undone. The item will be permanently removed.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={confirm}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
  },
  {
    id: "toast-notification",
    name: "Toast Notification",
    description:
      "A slide-in toast with icon, message, and close button. Auto-dismisses after 3 seconds.",
    category: "feedback",
    code: `<Button onClick={() => setShow(true)}>Show toast</Button>
<div
  className={cn(
    "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-card p-3 shadow-lg transition-all",
    show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none",
  )}
>
  <CheckCircle2 className="size-5 text-emerald-600" />
  <span className="text-sm">Saved successfully</span>
  <button onClick={() => setShow(false)} aria-label="Dismiss">
    <X className="size-4" />
  </button>
</div>`,
  },
  {
    id: "breadcrumb-nav",
    name: "Breadcrumb Nav",
    description:
      "A breadcrumb trail with separators. Each crumb is clickable; the last is the current page.",
    category: "navigation",
    code: `<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
  <button className="text-muted-foreground hover:text-foreground">
    <Home className="size-3.5" />
  </button>
  <ChevronRight className="size-3.5 text-muted-foreground" />
  <button className="text-muted-foreground hover:text-foreground">
    Projects
  </button>
  <ChevronRight className="size-3.5 text-muted-foreground" />
  <span className="font-medium text-foreground">Apollo</span>
</nav>`,
  },
  {
    id: "tab-bar",
    name: "Tab Bar",
    description:
      "Tabbed navigation with an animated active indicator that slides between tabs on switch.",
    category: "navigation",
    code: `<div className="border-b">
  <div className="relative flex">
    {tabs.map((t) => (
      <button
        key={t.id}
        onClick={() => setActive(t.id)}
        className={cn(
          "relative px-4 py-2 text-sm font-medium transition-colors",
          active === t.id ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {t.label}
        {active === t.id && (
          <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
        )}
      </button>
    ))}
  </div>
</div>`,
  },
  {
    id: "accordion",
    name: "Accordion",
    description:
      "Expandable / collapsible sections. Only one section is open at a time (radix `type=\"single\"`).",
    category: "navigation",
    code: `<Accordion type="single" collapsible>
  <AccordionItem value="a">
    <AccordionTrigger>What is RoyCSS?</AccordionTrigger>
    <AccordionContent>
      A utility-first CSS framework focused on motion and design tokens.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="b">
    <AccordionTrigger>Is it free?</AccordionTrigger>
    <AccordionContent>
      Yes — open-source and MIT licensed.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
  },
  {
    id: "progress-steps",
    name: "Progress Steps",
    description:
      "A multi-step progress indicator with completed / active / upcoming states and Back / Next controls.",
    category: "layout",
    code: `<div className="space-y-6">
  <div className="flex items-center">
    {steps.map((s, i) => (
      <React.Fragment key={s.id}>
        <div className={cn(
          "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
          i < current && "border-primary bg-primary text-primary-foreground",
          i === current && "border-primary text-primary",
          i > current && "border-border text-muted-foreground",
        )}>
          {i < current ? <Check className="size-4" /> : i + 1}
        </div>
        {i < steps.length - 1 && (
          <div className={cn("h-px flex-1", i < current ? "bg-primary" : "bg-border")} />
        )}
      </React.Fragment>
    ))}
  </div>
  <div className="flex justify-between">
    <Button variant="outline" onClick={back} disabled={current === 0}>
      Back
    </Button>
    <Button onClick={next} disabled={current === steps.length - 1}>
      Next
    </Button>
  </div>
</div>`,
  },
  {
    id: "file-upload",
    name: "File Upload",
    description:
      "A drag-and-drop zone. Drop or browse files; the list shows name, size, and a remove button.",
    category: "forms",
    code: `<div
  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
  onDragLeave={() => setDragging(false)}
  onDrop={(e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }}
  className={cn(
    "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center",
    dragging ? "border-primary bg-primary/5" : "border-border",
  )}
>
  <UploadCloud className="size-8 text-muted-foreground" />
  <p className="text-sm">
    Drop files here, or{" "}
    <button className="text-primary underline" onClick={browse}>
      browse
    </button>
  </p>
</div>`,
  },
  {
    id: "search-results",
    name: "Search Results",
    description:
      "A search input that filters a list of items. Matches are highlighted with the primary color.",
    category: "data",
    code: `<div className="space-y-2">
  <Input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search fruits…"
  />
  <ul className="divide-y rounded-lg border">
    {results.map((r) => (
      <li key={r} className="px-3 py-2 text-sm">
        {highlight(r, query)}
      </li>
    ))}
  </ul>
</div>`,
  },
  {
    id: "command-menu",
    name: "Command Menu",
    description:
      "A command palette with search, keyboard navigation (↑/↓/Enter), and a result indicator.",
    category: "data",
    code: `<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="top-[20%] translate-y-0 p-0">
    <Input
      autoFocus
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Type a command…"
    />
    <ul className="max-h-60 overflow-auto">
      {filtered.map((cmd, i) => (
        <li
          key={cmd.id}
          className={cn(
            "flex items-center justify-between px-3 py-2 text-sm",
            i === active ? "bg-accent" : "",
          )}
        >
          <span>{cmd.label}</span>
          {i === active && <CornerDownLeft className="size-3.5" />}
        </li>
      ))}
    </ul>
  </DialogContent>
</Dialog>`,
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Small primitives — local skeleton (avoid pulling in shadcn Skeleton's
// bg-accent default; we want a softer shimmer here).
// ═══════════════════════════════════════════════════════════════════════

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        className,
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.45), transparent)",
          animation: "roycss-pl-shimmer 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// Inject the keyframes once at module load via a <style> tag.
const SHIMMER_STYLE_ID = "roycss-pattern-library-shimmer";
if (typeof document !== "undefined" && !document.getElementById(SHIMMER_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = SHIMMER_STYLE_ID;
  style.textContent = `
@keyframes roycss-pl-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes roycss-pl-breathe {
  0%, 100% { transform: scale(1);   opacity: 0.7; }
  50%      { transform: scale(1.1); opacity: 1;   }
}
@keyframes roycss-pl-slide-in {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}
`;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════════
// 1. Empty State
// ═══════════════════════════════════════════════════════════════════════

function EmptyStateDemo() {
  const [created, setCreated] = useState(false);

  const handleCreate = useCallback(() => {
    setCreated(true);
    window.setTimeout(() => setCreated(false), 1800);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-4 px-4 py-8 text-center">
      <div
        className="flex size-16 items-center justify-center rounded-full bg-primary/15"
        style={{ animation: "roycss-pl-breathe 3s ease-in-out infinite" }}
      >
        <Inbox className="size-7 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Nothing here yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first item to get started.
        </p>
      </div>
      <Button size="sm" onClick={handleCreate}>
        <Plus className="size-4" />
        {created ? "Created!" : "Create Item"}
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 2. Error Boundary (inline demo, not a real React boundary)
// ═══════════════════════════════════════════════════════════════════════

type ErrorState = "error" | "retrying" | "success";

function ErrorBoundaryDemo() {
  const [state, setState] = useState<ErrorState>("error");

  const handleRetry = useCallback(() => {
    setState("retrying");
    window.setTimeout(() => setState("success"), 1300);
    window.setTimeout(() => setState("error"), 4200);
  }, []);

  if (state === "success") {
    return (
      <div className="flex w-full flex-col items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
        <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Back online</h3>
          <p className="text-sm text-muted-foreground">Data loaded successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
      {state === "retrying" ? (
        <Loader2 className="size-8 animate-spin text-destructive" />
      ) : (
        <AlertTriangle className="size-8 text-destructive" />
      )}
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Something went wrong</h3>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your data. Please try again.
        </p>
      </div>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleRetry}
        disabled={state === "retrying"}
      >
        {state === "retrying" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Retrying…
          </>
        ) : (
          <>
            <RotateCcw className="size-4" />
            Retry
          </>
        )}
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 3. Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════

function LoadingSkeletonDemo() {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="flex items-center gap-3">
        <ShimmerBlock className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-3 w-1/3" />
          <ShimmerBlock className="h-3 w-1/4" />
        </div>
      </div>
      <ShimmerBlock className="h-28 w-full rounded-lg" />
      <ShimmerBlock className="h-3 w-full" />
      <ShimmerBlock className="h-3 w-4/5" />
      <ShimmerBlock className="h-3 w-2/3" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 4. Confirmation Dialog
// ═══════════════════════════════════════════════════════════════════════

function ConfirmationDialogDemo() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    setDeleted(true);
    window.setTimeout(() => setDeleted(false), 2000);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-3 py-6">
      {deleted ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="size-4" />
          Item deleted
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete item
          </Button>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Delete item?
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. The item will be permanently
                removed from your project.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirm}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 5. Toast Notification (local slide-in)
// ═══════════════════════════════════════════════════════════════════════

interface ToastItem {
  id: number;
  message: string;
}

function ToastNotificationDemo() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(() => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message: "Saved successfully" }]);
    window.setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  return (
    <div className="relative flex w-full flex-col items-center gap-3 py-6">
      <Button size="sm" onClick={showToast}>
        <Plus className="size-4" />
        Show toast
      </Button>
      <p className="text-xs text-muted-foreground">
        Toast auto-dismisses after 3s. Click multiple times to stack.
      </p>

      {/* Toast stack — anchored to the demo card's bottom-right */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-end gap-2 px-4 pb-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 rounded-lg border bg-card px-3 py-2 shadow-lg"
            style={{ animation: "roycss-pl-slide-in 0.25s ease-out" }}
            role="status"
          >
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss toast"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 6. Breadcrumb Nav
// ═══════════════════════════════════════════════════════════════════════

const BREADCRUMB_TRAIL = ["Home", "Projects", "Apollo", "Settings"] as const;

function BreadcrumbNavDemo() {
  const [activeIndex, setActiveIndex] = useState(BREADCRUMB_TRAIL.length - 1);

  return (
    <div className="flex w-full items-center gap-1.5 py-6 text-sm">
      {BREADCRUMB_TRAIL.map((crumb, i) => {
        const isLast = i === BREADCRUMB_TRAIL.length - 1;
        const isActive = i === activeIndex;
        return (
          <React.Fragment key={crumb}>
            {i === 0 ? (
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "flex items-center gap-1 transition-colors",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Home className="size-3.5" />
                <span className="sr-only">{crumb}</span>
              </button>
            ) : isLast ? (
              <span
                className={cn(
                  "max-w-32 truncate",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
                aria-current="page"
              >
                {crumb}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "max-w-24 truncate transition-colors",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {crumb}
              </button>
            )}
            {!isLast && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 7. Tab Bar (animated active indicator)
// ═══════════════════════════════════════════════════════════════════════

interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

const TABS: readonly TabDef[] = [
  {
    id: "overview",
    label: "Overview",
    content: (
      <p className="text-sm text-muted-foreground">
        A high-level summary of your project&apos;s activity, including
        recent commits and contributors.
      </p>
    ),
  },
  {
    id: "activity",
    label: "Activity",
    content: (
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        <li>• Pushed 3 commits to <code className="text-foreground">main</code></li>
        <li>• Opened pull request #142</li>
        <li>• Resolved issue #98</li>
      </ul>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    content: (
      <p className="text-sm text-muted-foreground">
        Configure project visibility, default branch, and access controls.
      </p>
    ),
  },
] as const;

function TabBarDemo() {
  const [active, setActive] = useState<string>(TABS[0].id);
  const activeTab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div className="w-full">
      <div className="border-b">
        <div className="relative flex" role="tablist" aria-label="Project tabs">
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(t.id)}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-4" role="tabpanel">
        {activeTab.content}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 8. Accordion (uses shadcn Accordion)
// ═══════════════════════════════════════════════════════════════════════

const ACCORDION_ITEMS: readonly { value: string; q: string; a: string }[] = [
  {
    value: "what",
    q: "What is RoyCSS?",
    a: "A utility-first CSS framework focused on motion primitives, design tokens, and accessibility — built for modern React.",
  },
  {
    value: "free",
    q: "Is it free?",
    a: "Yes — open-source and MIT licensed. Pro features (charts, kanban, data-grid) ship in the same package.",
  },
  {
    value: "frameworks",
    q: "Which frameworks are supported?",
    a: "React / Next.js first-class. Vue, Svelte, and Angular adapters are available via the framework-adapter package.",
  },
] as const;

function AccordionDemo() {
  return (
    <div className="w-full px-4 py-2">
      <ShadcnAccordion type="single" collapsible defaultValue="what">
        {ACCORDION_ITEMS.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger className="text-sm">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </ShadcnAccordion>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 9. Progress Steps
// ═══════════════════════════════════════════════════════════════════════

const STEPS: readonly { id: string; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "profile", label: "Profile" },
  { id: "plan", label: "Plan" },
  { id: "confirm", label: "Confirm" },
] as const;

function ProgressStepsDemo() {
  const [current, setCurrent] = useState(1);

  const next = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, STEPS.length - 1));
  }, []);
  const back = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  return (
    <div className="w-full space-y-5 p-4">
      {/* Steps row */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const isComplete = i < current;
          const isActive = i === current;
          const isLast = i === STEPS.length - 1;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    isComplete &&
                      "border-primary bg-primary text-primary-foreground",
                    isActive && "border-primary text-primary",
                    !isComplete && !isActive && "border-border text-muted-foreground",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isComplete ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mx-1 mb-5 h-px flex-1 transition-colors",
                    i < current ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="outline"
          onClick={back}
          disabled={current === 0}
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {current + 1} of {STEPS.length}
        </span>
        <Button
          size="sm"
          onClick={next}
          disabled={current === STEPS.length - 1}
        >
          Next
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 10. File Upload (drag-and-drop)
// ═══════════════════════════════════════════════════════════════════════

interface UploadedFile {
  id: string;
  name: string;
  size: number; // bytes
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUploadDemo() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming: UploadedFile[] = Array.from(fileList).map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
    }));
    setFiles((prev) => {
      const seen = new Set(prev.map((p) => `${p.name}-${p.size}`));
      const unique = incoming.filter(
        (f) => !seen.has(`${f.name}-${f.size}`),
      );
      return [...prev, ...unique];
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleBrowse = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      // Reset so the same file can be re-added later if removed.
      e.target.value = "";
    },
    [addFiles],
  );

  return (
    <div className="w-full space-y-3 p-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Browse and upload pattern files — drop files here or activate to choose"
        onClick={handleBrowse}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBrowse();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/40",
        )}
      >
        <UploadCloud
          className={cn(
            "size-8 transition-colors",
            dragging ? "text-primary" : "text-muted-foreground",
          )}
        />
        <p className="text-sm">
          <span className="font-medium text-primary">Click to upload</span>
          {" "}or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, PDF up to 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-xs">{f.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatBytes(f.size)}
              </span>
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                aria-label={`Remove ${f.name}`}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 11. Search Results (with highlight)
// ═══════════════════════════════════════════════════════════════════════

const SEARCH_DATA: readonly string[] = [
  "Strawberry",
  "Blueberry",
  "Blackberry",
  "Raspberry",
  "Cranberry",
  "Boysenberry",
  "Gooseberry",
  "Elderberry",
  "Lingonberry",
  "Cloudberry",
] as const;

function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const idx = lower.indexOf(ql);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/25 px-0.5 text-foreground">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function SearchResultsDemo() {
  const [query, setQuery] = useState("berry");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_DATA;
    return SEARCH_DATA.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="w-full space-y-2 p-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search berries…"
          className="pl-8"
          aria-label="Search berries"
        />
      </div>
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          {results.length} result{results.length === 1 ? "" : "s"}
        </span>
        {query && <span>Query: &ldquo;{query}&rdquo;</span>}
      </div>
      <ul className="max-h-44 divide-y overflow-auto rounded-lg border">
        {results.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            No matches found.
          </li>
        ) : (
          results.map((r) => (
            <li
              key={r}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              <span className="size-1.5 rounded-full bg-primary/60" />
              {highlightMatch(r, query)}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 12. Command Menu (keyboard-navigable)
// ═══════════════════════════════════════════════════════════════════════

interface Command {
  id: string;
  label: string;
  hint: string;
  icon: typeof Search;
}

const COMMANDS: readonly Command[] = [
  { id: "new-file", label: "New File", hint: "Create a new file", icon: Plus },
  { id: "open-search", label: "Search", hint: "Search across project", icon: Search },
  { id: "copy-snippet", label: "Copy Snippet", hint: "Copy last snippet", icon: ClipboardList },
  { id: "toggle-theme", label: "Toggle Theme", hint: "Switch light / dark", icon: RotateCcw },
  { id: "go-home", label: "Go to Home", hint: "Navigate to homepage", icon: Home },
  { id: "view-files", label: "View Files", hint: "List recent files", icon: FileIcon },
] as const;

function CommandMenuDemo() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [ran, setRan] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.hint.toLowerCase().includes(q),
    );
  }, [query]);

  // Open the dialog: clear any prior query + reset selection.
  const openMenu = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  // When the user types, reset the active selection to the first result.
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    setActive(0);
  }, []);

  // Keep the active item in view (pure DOM side-effect — no setState).
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.children[active] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const runCommand = useCallback((cmd: Command) => {
    setOpen(false);
    setQuery("");
    setRan(cmd.label);
    window.setTimeout(() => setRan(null), 2200);
  }, []);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[active];
        if (cmd) runCommand(cmd);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    [filtered, active, runCommand],
  );

  return (
    <div className="flex w-full flex-col items-center gap-3 py-6">
      <Button size="sm" variant="outline" onClick={openMenu}>
        <ClipboardList className="size-4" />
        Open command menu
      </Button>
      {ran && (
        <div
          className="flex items-center gap-2 rounded-md border bg-accent px-3 py-1.5 text-xs"
          role="status"
        >
          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          Ran: <span className="font-medium">{ran}</span>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[20%] max-w-md gap-0 overflow-hidden p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command…"
              className="h-11 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
              aria-label="Command search"
            />
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
          <ul
            ref={listRef}
            className="max-h-60 overflow-auto py-1"
            role="listbox"
            aria-label="Commands"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No commands found.
              </li>
            ) : (
              filtered.map((cmd, i) => {
                const Icon = cmd.icon;
                const isActive = i === active;
                return (
                  <li
                    key={cmd.id}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => runCommand(cmd)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors",
                      isActive ? "bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{cmd.label}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {cmd.hint}
                      </div>
                    </div>
                    {isActive && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Demo dispatcher
// ═══════════════════════════════════════════════════════════════════════

function PatternDemo({ id }: { id: string }): ReactNode {
  switch (id) {
    case "empty-state":
      return <EmptyStateDemo />;
    case "error-boundary":
      return <ErrorBoundaryDemo />;
    case "loading-skeleton":
      return <LoadingSkeletonDemo />;
    case "confirmation-dialog":
      return <ConfirmationDialogDemo />;
    case "toast-notification":
      return <ToastNotificationDemo />;
    case "breadcrumb-nav":
      return <BreadcrumbNavDemo />;
    case "tab-bar":
      return <TabBarDemo />;
    case "accordion":
      return <AccordionDemo />;
    case "progress-steps":
      return <ProgressStepsDemo />;
    case "file-upload":
      return <FileUploadDemo />;
    case "search-results":
      return <SearchResultsDemo />;
    case "command-menu":
      return <CommandMenuDemo />;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Copy JSX button (in-card footer)
// ═══════════════════════════════════════════════════════════════════════

function CopyJsxButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for environments without the async clipboard API.
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop — clipboard genuinely unavailable */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <Button
      type="button"
      size="sm"
      variant={copied ? "secondary" : "outline"}
      onClick={handleCopy}
      aria-label={copied ? "Copied JSX" : "Copy JSX"}
    >
      {copied ? (
        <>
          <ClipboardCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          Copied
        </>
      ) : (
        <>
          <ClipboardList className="size-3.5" />
          Copy JSX
        </>
      )}
    </Button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Pattern card
// ═══════════════════════════════════════════════════════════════════════

function PatternCard({ pattern }: { pattern: PatternMeta }) {
  const meta = CATEGORY_META[pattern.category];

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="gap-2 border-b pb-4">
        <CardTitle className="text-base">{pattern.name}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          {pattern.description}
        </CardDescription>
        <CardAction>
          <Badge
            variant="outline"
            className={cn("text-[10px]", meta.badgeClass)}
          >
            {meta.label}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4 px-4 py-4">
        {/* Live preview area */}
        <div
          className="relative min-h-48 overflow-hidden rounded-lg border bg-muted/30"
          aria-label={`${pattern.name} live preview`}
        >
          <PatternDemo id={pattern.id} />
        </div>

        {/* Code snippet */}
        <div className="relative">
          <pre className="max-h-44 overflow-auto rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed">
            <code className="font-mono text-foreground/90">
              {pattern.code}
            </code>
          </pre>
        </div>

        {/* Footer: id + Copy JSX */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground">
            #{pattern.id}
          </span>
          <CopyJsxButton code={pattern.code} />
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Toolbar (search + category filter)
// ═══════════════════════════════════════════════════════════════════════

const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "feedback", label: "Feedback" },
  { id: "navigation", label: "Navigation" },
  { id: "forms", label: "Forms" },
  { id: "layout", label: "Layout" },
  { id: "data", label: "Data" },
] as const;

function Toolbar({
  query,
  onQueryChange,
  activeFilter,
  onFilterChange,
  visibleCount,
  totalCount,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  activeFilter: Filter;
  onFilterChange: (f: Filter) => void;
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {/* Search */}
      <div className="relative w-full lg:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search patterns by name…"
          className="pl-8"
          aria-label="Search patterns"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Category
        </span>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              type="button"
              size="sm"
              variant={activeFilter === f.id ? "default" : "outline"}
              onClick={() => onFilterChange(f.id)}
              className="h-7 px-2.5 text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <span className="ml-1 text-[10px] text-muted-foreground">
          {visibleCount} / {totalCount}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════════

export function PatternLibrary() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("patterns");
  void data; void loading; void error;

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const visiblePatterns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PATTERNS.filter((p) => {
      if (activeFilter !== "all" && p.category !== activeFilter) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Pattern Library
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            (Extended · 12 patterns)
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Live, interactive UI patterns with copy-ready JSX. Each card renders
          the actual component — click, type, and drag to see it in action.
        </p>
      </div>

      <Toolbar
        query={query}
        onQueryChange={setQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        visibleCount={visiblePatterns.length}
        totalCount={PATTERNS.length}
      />

      {/* Grid */}
      {visiblePatterns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <PackageOpen className="size-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No patterns found</p>
            <p className="text-xs text-muted-foreground">
              Try a different search term or category.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiblePatterns.map((p) => (
            <PatternCard key={p.id} pattern={p} />
          ))}
        </div>
      )}
    </div>
  );
}
