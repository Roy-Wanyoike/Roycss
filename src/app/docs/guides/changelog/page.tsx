import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — RoyCSS Docs",
  description: "RoyCSS version history. Highlights of major and minor releases from 1.0 to current.",
};

export default function ChangelogPage() {
  return (
    <>
      <h1>Changelog</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS follows semantic versioning. This page highlights
        every major and minor release since 1.0. For the full
        commit history, see the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="https://github.com/Roy-Wanyoike/roycss">
          GitHub repository
        </a>
        .
      </p>

      <h2 id="2-0-0">2.0.0 — 2025-01</h2>
      <p>
        The CSS-first rewrite. 1,869 effects across seven categories,
        zero JavaScript runtime in the base library.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`BREAKING: drops IE11 + Safari < 14 support
feat: 1,869 effects, up from 312 in v1
feat: full OKLCH palette (was HSL)
feat: scroll-driven animations via animation-timeline
feat: container-query-aware card variants
feat: RoyMotion opt-in JS subsystem
feat: MCP server for AI assistants
feat: VS Code extension + snippets
feat: CLI with lint, inspect, bundle, palette commands
fix: reduced-motion guard now applies to all effects
fix: GPU layer budget — only animating elements get will-change
chore: bundle dropped from 240 KB → 80 KB gzipped`}</code>
      </pre>

      <h2 id="1-5-0">1.5.0 — 2024-08</h2>
      <p>
        Added the per-category CSS file layout — first step toward
        tree-shaking. Backwards-compatible with 1.x imports.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`feat: per-category files (hover.css, text.css, …)
feat: 92 new hover effects
feat: container-query support for cards
fix: focus-visible ring color now tracks --r-accent
chore: switch to lightningcss for builds`}</code>
      </pre>

      <h2 id="1-4-0">1.4.0 — 2024-04</h2>
      <p>
        Color-system revamp — first OKLCH experiments behind a flag.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`feat: experimental OKLCH palette (opt-in)
feat: 47 new loader variants
fix: hover lift no longer triggers layout on Safari
fix: text-shimmer respects prefers-reduced-motion`}</code>
      </pre>

      <h2 id="1-3-0">1.3.0 — 2024-01</h2>
      <p>
        Accessibility focus. Every interactive class gained a{" "}
        <code>:focus-visible</code> rule.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`feat: focus-visible ring on all interactive classes
feat: minimum 44x44px touch targets (WCAG 2.5.5)
feat: .sr-only utility
fix: button hover color no longer changes border width
chore: bumped to @property for typed custom properties`}</code>
      </pre>

      <h2 id="1-2-0">1.2.0 — 2023-09</h2>
      <p>
        Card category landed.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`feat: r-card-* category (52 effects)
feat: r-border-* category (38 effects)
fix: glassmorphism fallback for unsupported backdrop-filter`}</code>
      </pre>

      <h2 id="1-1-0">1.1.0 — 2023-06</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`feat: r-bg-* category (45 effects)
feat: r-loader-* category (38 effects)
fix: aurora blobs no longer paint on top of content`}</code>
      </pre>

      <h2 id="1-0-0">1.0.0 — 2023-03</h2>
      <p>
        Initial public release. 312 effects across hover, text, and
        buttons categories.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`feat: 312 effects (hover, text, buttons)
feat: HSL color system (replaced by OKLCH in 2.0)
feat: prefers-reduced-motion global guard
feat: full CSS variable theming
chore: first stable release`}</code>
      </pre>

      <h2 id="upgrading">Upgrading</h2>
      <p>
        Major upgrades ship with a migration guide. See the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/guides/migration">
          Migration
        </a>{" "}
        page for the 1.x → 2.x path.
      </p>
    </>
  );
}
