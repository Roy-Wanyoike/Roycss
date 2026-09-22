"use client";

/**
 * DocsPageMeta — "Edit this page on GitHub" link + last-reviewed stamp
 * (issue #127 / PF-014 acceptance #4 + #5).
 *
 * The source path is derived from the live pathname via
 * `getDocSourcePath()` (sitemap-validated — unknown pages render
 * nothing). The link opens GitHub's web editor for the page's
 * `page.tsx` on `main`.
 */

import { usePathname } from "next/navigation";
import { Github, Clock } from "lucide-react";
import {
  getDocSourcePath,
  DOCS_REPO_EDIT_BASE,
  DOCS_LAST_REVIEWED,
} from "@/lib/docs-sitemap";

export function DocsPageMeta() {
  const pathname = usePathname();
  const source = getDocSourcePath(pathname ?? "");
  if (!source) return null;

  const href = `${DOCS_REPO_EDIT_BASE}/${source}`;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-4 text-xs text-muted-foreground">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        aria-label={`Edit this page on GitHub (${source})`}
      >
        <Github className="size-3.5" />
        Edit this page on GitHub
      </a>
      <span className="inline-flex items-center gap-1.5" title="Last full docs review pass">
        <Clock className="size-3.5" />
        Last reviewed{" "}
        <time dateTime={DOCS_LAST_REVIEWED}>
          {new Date(DOCS_LAST_REVIEWED + "T00:00:00Z").toLocaleDateString(
            "en-US",
            { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" },
          )}
        </time>
      </span>
    </div>
  );
}
