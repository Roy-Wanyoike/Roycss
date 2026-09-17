import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED, CATEGORY_COUNT } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "Changelog — RoyCSS Docs",
  description: "RoyCSS version history, from the repo's CHANGELOG.md. Semver, Keep-a-Changelog format.",
};

export default function ChangelogPage() {
  return (
    <>
      <h1>Changelog</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS follows semantic versioning and the Keep-a-Changelog
        format. This page mirrors the repository&apos;s{" "}
        <code>CHANGELOG.md</code> — that file is the source of
        truth, and per-release detail also lives on the{" "}
        <a className="text-primary hover:underline" href="https://github.com/Roy-Wanyoike/Roycss/releases">
          GitHub releases page
        </a>
        .
      </p>

      <h2 id="2-0-0">2.0.0 — 2026-09-13</h2>
      <p>
        First npm release of RoyCSS v2 (v1 was distributed via the
        website only).
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`### Added

- ${EFFECT_COUNT_FORMATTED} production-ready CSS effects across ${CATEGORY_COUNT} categories —
  OKLCH colors, logical properties, container queries, scroll-driven
  animations, and a global prefers-reduced-motion kill switch.
- Dual module builds with TypeScript declarations:
  import { effects } from "roycss"  (ESM, dist/effects.js)
  const { effects } = require("roycss")  (CommonJS, dist/effects.cjs)
  dist/effects.d.ts types (CSSEffect interface).
- Subpath exports: roycss/css, roycss/css/min, roycss/effects.json,
  roycss/class-index, roycss/motion-library, roycss/critical.css,
  roycss/fallbacks, roycss/package.json.
- Zero runtime dependencies — CSS + data only, zero JavaScript at runtime.

### Changed

- Version 2.0.0 continues the public v1 → v2 version line
  distributed through the website (see DEPRECATION.md for the
  v1 → v2 codemod).`}</code>
      </pre>

      <h2 id="earlier-releases">Earlier releases</h2>
      <p>
        RoyCSS v1 was distributed through the website, before the
        package moved to npm. Its version line continues directly
        into 2.0.0 — there are no intermediate npm releases to
        list. For the v1 → v2 class-name and import changes, see{" "}
        <code>docs/DEPRECATION.md</code> in the repository (it
        ships a codemod), and the{" "}
        <a className="text-primary hover:underline" href="/docs/guides/migration">
          Migration guide
        </a>{" "}
        for moving between animation libraries.
      </p>

      <h2 id="upcoming">Upcoming changes</h2>
      <p>
        In-flight work is tracked with{" "}
        <a className="text-primary hover:underline" href="https://github.com/Roy-Wanyoike/Roycss/blob/main/docs/PENDING-FEATURES.md">
          docs/PENDING-FEATURES.md
        </a>{" "}
        in the repository — an honest, audited list of what is
        done, in progress, and not started. Release notes for
        future versions are generated from Changesets merged in
        pull requests.
      </p>
    </>
  );
}
