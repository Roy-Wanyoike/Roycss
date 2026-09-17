import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  inProgressItems,
  plannedItems,
  shippedItems,
  LAUNCH_MILESTONES,
  ROADMAP_SOURCE_URL,
  ROADMAP_SYNCED_AT,
  type RoadmapItem,
} from "@/lib/roadmap-data";

/**
 * Public product roadmap (issue #130 / PF-045 acceptance #4).
 *
 * A static server component — zero client JS — following the standalone
 * page conventions established by /privacy and /terms (see
 * `src/components/roycss/legal-page-shell.tsx`): sticky top header with
 * the RoyCSS mark, a single centered prose column styled with the site
 * design tokens (`bg-background`, `text-foreground`, `text-muted-foreground`,
 * `text-primary`), and a minimal footer. Route segment config: force-static
 * keeps this prerendered at build time.
 *
 * The content is a curated cut of `docs/PENDING-FEATURES.md`
 * (`src/lib/roadmap-data.ts`) — honest states only: an item is "shipped"
 * only when the backlog itself says so, and owner-only work is listed as
 * launch milestones, not feature work.
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Roadmap — RoyCSS",
  description:
    "The public RoyCSS roadmap: what's in progress now, what's planned next, recent shipped work, and the owner-side launch milestones. Synced from docs/PENDING-FEATURES.md — honest states, no overclaiming.",
};

const STATUS_PILLS: Record<
  RoadmapItem["status"],
  { label: string; className: string }
> = {
  "in-progress": {
    label: "In progress",
    className: "bg-primary/10 text-primary",
  },
  planned: {
    label: "Planned",
    className: "bg-muted text-muted-foreground",
  },
  shipped: {
    label: "Shipped",
    className: "border border-border text-foreground",
  },
};

function RoadmapRow({ item }: { item: RoadmapItem }) {
  const pill = STATUS_PILLS[item.status];
  return (
    <li className="border-b border-border/40 py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-xs text-muted-foreground">
          {item.id}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${pill.className}`}
        >
          {pill.label}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>
    </li>
  );
}

function RoadmapSection({
  id,
  title,
  blurb,
  children,
}: {
  id: string;
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="scroll-mt-20">
      <h2
        id={`${id}-heading`}
        className="font-display text-xl font-semibold text-foreground"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header — mirrors the legal-page shell / docs TopBar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
            aria-label="RoyCSS — back to home"
          >
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              R
            </span>
            <span className="hidden sm:inline">RoyCSS</span>
          </Link>
          <nav
            aria-label="Site pages"
            className="flex items-center gap-4 text-xs text-muted-foreground"
          >
            <Link href="/docs" className="transition-colors hover:text-primary">
              Docs
            </Link>
            <Link
              href="/docs/guides/contributing"
              className="transition-colors hover:text-primary"
            >
              Contributing
            </Link>
            <span aria-current="page" className="text-foreground">
              Roadmap
            </span>
          </nav>
        </div>
      </header>

      {/* Centered prose column */}
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Roadmap
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
          What RoyCSS is building
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          An honest, public view of the backlog: what is being worked on
          now, what comes next, and what recently shipped. No dates are
          promised — statuses are synced from the engineering backlog,
          which is the single source of truth.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Synced {ROADMAP_SYNCED_AT} from{" "}
          <a
            href={ROADMAP_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:decoration-2"
          >
            docs/PENDING-FEATURES.md
          </a>{" "}
          on GitHub.
        </p>

        <div className="mt-10 space-y-12 border-t border-border/60 pt-10">
          <RoadmapSection
            id="now"
            title="Now"
            blurb="Actively in progress — each line states what already exists and what remains."
          >
            <ul>
              {inProgressItems.map((item) => (
                <RoadmapRow key={item.id} item={item} />
              ))}
            </ul>
          </RoadmapSection>

          <RoadmapSection
            id="next"
            title="Next"
            blurb="Planned work in rough priority order — groundwork that already exists is called out, never overstated."
          >
            <ul>
              {plannedItems.map((item) => (
                <RoadmapRow key={item.id} item={item} />
              ))}
            </ul>
          </RoadmapSection>

          <RoadmapSection
            id="shipped"
            title="Shipped"
            blurb="Recent highlights — the full history lives in the backlog and the release notes."
          >
            <ul>
              {shippedItems.map((item) => (
                <RoadmapRow key={item.id} item={item} />
              ))}
            </ul>
          </RoadmapSection>

          <RoadmapSection
            id="launch"
            title="Launch milestones"
            blurb="Owner-side actions that gate the next launch — these need account access, not engineering, and each links to its tracking issue."
          >
            <ul>
              {LAUNCH_MILESTONES.map((milestone) => (
                <li
                  key={milestone.id}
                  className="border-b border-border/40 py-4 last:border-b-0"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {milestone.title}
                    </h3>
                    {milestone.issue ? (
                      <a
                        href={`https://github.com/Roy-Wanyoike/Roycss/issues/${milestone.issue}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-xs text-primary underline underline-offset-2 hover:decoration-2"
                      >
                        #{milestone.issue}
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {milestone.description}
                  </p>
                </li>
              ))}
            </ul>
          </RoadmapSection>

          <RoadmapSection
            id="contributing"
            title="Shape the roadmap"
            blurb="The ladder from first PR to maintainer is documented — climb it."
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              Contributions follow the{" "}
              <Link
                href="/docs/guides/contributing"
                className="text-primary underline underline-offset-2 hover:decoration-2"
              >
                contributing guide
              </Link>{" "}
              — and the{" "}
              <a
                href="https://github.com/Roy-Wanyoike/Roycss/blob/main/docs/CONTRIBUTING.md#contributor-ladder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:decoration-2"
              >
                contributor ladder
              </a>{" "}
              (contributor &rarr; active contributor &rarr; module owner
              &rarr; maintainer) spells out the concrete criteria for each
              rung. Feature requests and bug reports belong in the{" "}
              <a
                href="https://github.com/Roy-Wanyoike/Roycss/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:decoration-2"
              >
                issue tracker
              </a>
              .
            </p>
          </RoadmapSection>
        </div>
      </main>

      {/* Minimal footer — matches the legal-page shell */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} RoyCSS</p>
          <div className="flex items-center gap-4">
            <Link
              href="/roadmap"
              className="transition-colors hover:text-primary"
            >
              Roadmap
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-primary"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
