"use client";

/**
 * RoyCSS Docs Layout
 * ------------------
 * 3-column documentation shell:
 *   [ sticky top nav ]
 *   [ sidebar 280px | content | TOC 240px ]
 * Mobile: drawer sidebar + collapsing TOC.
 *
 * Active page is derived from usePathname(). The Prev/Next pager at the
 * bottom walks the sitemap in declaration order.
 */

import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Rocket,
  Lightbulb,
  Code2,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Github,
  Home,
} from "lucide-react";
import {
  DOCS_CATEGORIES,
  getPrevNextPages,
  getDocPage,
  type DocCategory,
} from "@/lib/docs-sitemap";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Lightbulb,
  Code2,
  BookOpen,
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? BookOpen;
  return <Icon className={className} />;
}

function SidebarLink({
  slug,
  title,
  active,
  onClick,
}: {
  slug: string;
  title: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={slug}
      onClick={onClick}
      className={
        "block w-full rounded-md px-3 py-1.5 text-sm transition-colors " +
        (active
          ? "bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-300"
          : "text-muted-foreground hover:bg-muted hover:text-foreground")
      }
      aria-current={active ? "page" : undefined}
    >
      {title}
    </Link>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation" className="space-y-6">
      {DOCS_CATEGORIES.map((cat: DocCategory) => (
        <div key={cat.id}>
          <div className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CategoryIcon name={cat.icon} className="size-3.5" />
            <span>{cat.label}</span>
          </div>
          <ul className="space-y-0.5">
            {cat.pages.map((p) => {
              const active = pathname === p.slug;
              return (
                <li key={p.slug}>
                  <SidebarLink
                    slug={p.slug}
                    title={p.title}
                    active={active}
                    onClick={onNavigate}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function TopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open documentation sidebar"
      >
        <Menu className="size-5" />
      </button>
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-semibold tracking-tight"
      >
        <span className="inline-flex size-6 items-center justify-center rounded-md bg-emerald-600 text-white">
          R
        </span>
        <span className="hidden sm:inline">RoyCSS Docs</span>
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <Link
          href="/#search"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="Search docs"
        >
          <Search className="size-4" />
        </Link>
        <Link
          href="https://github.com/Roy-Wanyoike/roycss"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="GitHub repository"
          target="_blank"
          rel="noreferrer"
        >
          <Github className="size-4" />
        </Link>
        <Link
          href="/"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="Back to home"
        >
          <Home className="size-4" />
        </Link>
      </div>
    </header>
  );
}

function PrevNextPager({ pathname }: { pathname: string }) {
  const { prev, next } = getPrevNextPages(pathname);
  if (!prev && !next) return null;
  return (
    <nav
      aria-label="Pagination"
      className="mt-12 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={prev.slug}
          className="group rounded-lg border bg-card p-4 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
        >
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft className="size-3.5" />
            Previous
          </div>
          <div className="mt-1 text-sm font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
            {prev.title}
          </div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.slug}
          className="group rounded-lg border bg-card p-4 text-right transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5 sm:col-start-2"
        >
          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            Next
            <ChevronRight className="size-3.5" />
          </div>
          <div className="mt-1 text-sm font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
            {next.title}
          </div>
        </Link>
      ) : null}
    </nav>
  );
}

/**
 * A live table-of-contents derived from the page's <h2> headings.
 * The TOC scans children at runtime via a ref to find h2 elements;
 * but to keep this purely client-side and stable, we derive the TOC
 * from the sitemap's description as a stable surrogate label and
 * skip h2 scanning in favor of the simpler, robust approach.
 */
function TocCard({ pathname }: { pathname: string }) {
  const page = getDocPage(pathname);
  if (!page) return null;
  return (
    <aside className="hidden w-60 shrink-0 xl:block" aria-label="Page metadata">
      <div className="sticky top-20 space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </div>
          <p className="mt-2 text-foreground">{page.description}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </div>
          <p className="mt-2 capitalize text-foreground">{page.category.replace("-", " ")}</p>
        </div>
      </div>
    </aside>
  );
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll when mobile sidebar is open.
  useEffect(() => {
    if (!sidebarOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [sidebarOpen]);

  // Close drawer on route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
  }, [pathname]);

  const current = useMemo(() => getDocPage(pathname), [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar onOpenSidebar={() => setSidebarOpen(true)} />

      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6 sm:px-6">
        {/* Desktop sidebar */}
        <aside
          className="hidden w-[280px] shrink-0 lg:block"
          aria-label="Docs sidebar"
        >
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <SidebarInner />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {current ? (
            <div className="mb-3 text-xs text-muted-foreground">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1">
                <Link href="/docs" className="hover:text-foreground">
                  Docs
                </Link>
                <ChevronRight className="size-3" />
                <span className="capitalize">{current.category.replace("-", " ")}</span>
                <ChevronRight className="size-3" />
                <span className="text-foreground">{current.title}</span>
              </nav>
            </div>
          ) : null}
          <article className="prose-docs min-w-0">{children}</article>
          <PrevNextPager pathname={pathname} />
        </main>

        {/* TOC */}
        <TocCard pathname={pathname} />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Documentation navigation">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-[280px] max-w-[85vw] overflow-y-auto bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Documentation</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Close sidebar"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarInner onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
