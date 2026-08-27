import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides Overview — RoyCSS Docs",
  description: "Browse all RoyCSS guides — custom effects, theming, migration, tree-shaking, performance, AI workflow, contributing, changelog.",
};

export default function GuidesOverviewPage() {
  const guides = [
    {
      slug: "/docs/guides/creating-custom-effects",
      title: "Custom Effects",
      summary:
        "Write your own r-* effect class. Naming, custom properties, reduced-motion guard, and lint registration.",
    },
    {
      slug: "/docs/guides/theming",
      title: "Theming",
      summary:
        "Full brand-color migration: pick an OKLCH accent, set up dark mode, bridge to design tokens.",
    },
    {
      slug: "/docs/guides/migration",
      title: "Migration",
      summary:
        "Move from Animate.css, GSAP, or Framer Motion to RoyCSS with before/after examples.",
    },
    {
      slug: "/docs/guides/tree-shaking",
      title: "Tree Shaking",
      summary:
        "Three import modes, custom bundles via CLI, and measured gzip savings down to 349 B.",
    },
    {
      slug: "/docs/guides/performance-optimization",
      title: "Performance",
      summary:
        "Lazy-loading, content-visibility, GPU layer budget, and Lighthouse audits that score 95-100.",
    },
    {
      slug: "/docs/guides/ai-workflow",
      title: "AI Workflow",
      summary:
        "Connect the MCP server, write effective prompts, and lint AI-generated RoyCSS code.",
    },
    {
      slug: "/docs/guides/contributing",
      title: "Contributing",
      summary:
        "Repo layout, effect authoring conventions, the PR checklist, and release process.",
    },
    {
      slug: "/docs/guides/changelog",
      title: "Changelog",
      summary:
        "Version history from 1.0 to current, with highlight notes for every release.",
    },
  ];

  return (
    <>
      <h1>Guides Overview</h1>
      <p className="text-lg text-muted-foreground">
        Practical, end-to-end walkthroughs for the most common
        RoyCSS workflows. Each guide is self-contained — read them
        in any order, or follow the suggested reading path below.
      </p>

      <h2 id="suggested-path">Suggested reading path</h2>
      <p>
        New to RoyCSS? Read the guides in this order:
      </p>
      <ol className="list-decimal pl-6 space-y-1">
        <li>Custom Effects — to understand the conventions.</li>
        <li>Theming — to make RoyCSS match your brand.</li>
        <li>Tree Shaking — to minimize your bundle.</li>
        <li>Performance — to hit Lighthouse 95+.</li>
        <li>AI Workflow — to integrate RoyCSS with your AI tools.</li>
      </ol>

      <h2 id="all-guides">All guides</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={g.slug}
            className="group rounded-lg border bg-card p-5 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
          >
            <div className="text-base font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
              {g.title}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {g.summary}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
