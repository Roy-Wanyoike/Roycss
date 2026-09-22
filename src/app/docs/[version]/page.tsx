import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Archive, FileText } from "lucide-react";
import {
  DOCS_CATEGORIES,
  DOCS_VERSIONS,
  resolveDocsVersion,
} from "@/lib/docs-sitemap";

/**
 * Versioned docs routing (issue #127 / PF-014 acceptance #3).
 *
 * `/docs/<version>` — the current version (and its per-minor snapshots)
 * permanently redirects to the canonical `/docs`; archived versions
 * render an honest snapshot notice with the full docs catalog linked to
 * the live pages. Static segments (getting-started, api, concepts,
 * guides) take routing precedence over this dynamic `[version]`
 * segment, so live doc URLs are never shadowed. Non-version slugs 404.
 */

export function generateStaticParams() {
  // Prebuild the known version lines; unknown slugs still resolve at
  // request time via resolveDocsVersion (no 404 for stale links).
  return DOCS_VERSIONS.map((v) => ({ version: v.version }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ version: string }>;
}): Promise<Metadata> {
  const { version } = await params;
  const info = resolveDocsVersion(version);
  if (!info) {
    // Unknown slug → the page component calls notFound(). Status may be
    // 200 when the parent client layout has already flushed the shell
    // (Next streaming behavior), so keep crawlers out explicitly.
    return {
      title: "Unknown docs version — RoyCSS Docs",
      robots: { index: false, follow: false },
    };
  }
  return {
    title:
      info.status === "current"
        ? `RoyCSS ${info.version} docs (current) — RoyCSS Docs`
        : `RoyCSS ${info.version} docs (archived) — RoyCSS Docs`,
    description: info.note,
    robots: info.status === "current" ? undefined : { index: false },
    // Self-canonical (issue #187 mechanical pass): archived snapshots are
    // noindex, but a self-referencing canonical keeps the signal neutral
    // instead of inheriting any default. Current-line params 308 to /docs
    // before render, so this only surfaces for archived pages.
    alternates: { canonical: `/docs/${version}` },
  };
}

export default async function DocsVersionPage({
  params,
}: {
  params: Promise<{ version: string }>;
}) {
  const { version } = await params;
  const info = resolveDocsVersion(version);

  // Not a version slug at all → the docs-aware 404 boundary.
  if (!info) notFound();

  // Current line (v2, v2.x …) → canonical unversioned docs.
  if (info.current) permanentRedirect("/docs");

  const reviewed = DOCS_VERSIONS.find((v) => v.version === info.version);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      {/* Archived banner */}
      <div
        className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4"
        role="note"
        aria-label="Archived documentation notice"
      >
        <div className="flex items-start gap-3">
          <Archive className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-foreground">
              {info.label}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {info.note} {reviewed?.note ?? ""}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              This snapshot is not updated anymore. The pages below point to
              the current documentation.
            </p>
            <Link
              href="/docs"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              View current docs
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Full catalog → live docs */}
      <nav aria-label="Documentation catalog" className="mt-8 space-y-8">
        {DOCS_CATEGORIES.map((category) => (
          <section key={category.id}>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {category.label}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {category.pages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={page.slug}
                    className="group flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <FileText className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">
                      {page.title}
                    </span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  );
}
