import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { DOCS_INDEX, searchDocs, type DocsIndexEntry } from "@/lib/docs-index";

/**
 * /docs single source of truth (issue #112 / UIX-F11).
 *
 * The /docs route pages are the ONLY documentation surface. This suite
 * pins the contract that replaced the retired DocsViewer sheet:
 *
 *   1. Coverage — the slim search index (src/lib/docs-index.ts) covers
 *      every route under src/app/docs (fs walk here is fine — this is a
 *      test, not a client bundle). A route either renders content
 *      (has a metadata export → must be indexed) or is a redirect whose
 *      target is indexed.
 *   2. Integrity — every index entry has a title + description (from the
 *      page metadata), a real /docs route, and lowercase keywords.
 *   3. Retirement — the 800 KB docs blobs and their consumers are gone
 *      for good: the files must not come back.
 *   4. Slimness — the index stays under 20 KB (vs. the 1.6 MB it replaced).
 *   5. Search — searchDocs honestly scopes docs search to
 *      title / description / keywords / route and returns real routes.
 *   6. Wiring — navbar / footer / mobile-menu "Docs" entries link to
 *      /docs/getting-started and the search overlay consumes the slim
 *      index (source-level scan, mirroring legal-pages.test.ts).
 */

const ROOT = resolve(__dirname, "../..");
const DOCS_ROUTE_DIR = join(ROOT, "src", "app", "docs");
const INDEX_FILE = join(ROOT, "src", "lib", "docs-index.ts");

/* ─── fs walk of every page.tsx under src/app/docs ────────────── */

function walkPages(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walkPages(abs, out);
    else if (entry.name === "page.tsx") out.push(abs);
  }
}

function routeFromPath(absPath: string): string {
  let rel = relative(DOCS_ROUTE_DIR, absPath);
  rel = rel.replace(/(^|[/\\])page\.tsx$/, "");
  return rel ? `/docs/${rel.replace(/\\/g, "/")}` : "/docs";
}

const pageFiles: string[] = [];
walkPages(DOCS_ROUTE_DIR, pageFiles);

const routesWithMetadata = new Map<string, string>(); // route → source
const redirectRoutes = new Map<string, string>(); // route → redirect target
const dynamicRoutes = new Map<string, string>(); // route → source (issue #127)
for (const abs of pageFiles) {
  const route = routeFromPath(abs);
  const source = readFileSync(abs, "utf8");
  if (/\[[^\]]+\]/.test(route.slice("/docs/".length))) {
    // Dynamic docs routes (versioned snapshots) resolve their own
    // params at request time — classified separately, see coverage.
    dynamicRoutes.set(route, source);
  } else if (/export const metadata/.test(source)) {
    routesWithMetadata.set(route, source);
  } else {
    const m = source.match(/redirect\(\s*"([^"]+)"\s*\)/);
    redirectRoutes.set(route, m ? m[1] : "");
  }
}

const indexedRoutes = new Set(DOCS_INDEX.map((e) => e.route));

/* ─── 1. Coverage ─────────────────────────────────────────────── */

describe("docs-index: coverage of the real /docs routes", () => {
  it("walks the 37 /docs route pages (35 content + /docs redirect + [version])", () => {
    expect(pageFiles).toHaveLength(37);
    expect(routesWithMetadata.size).toBe(35);
    expect(redirectRoutes.size).toBe(1);
    expect(dynamicRoutes.size).toBe(1);
  });

  it("indexes every content route under src/app/docs", () => {
    const missing = [...routesWithMetadata.keys()].filter((r) => !indexedRoutes.has(r));
    expect(missing).toEqual([]);
    expect(DOCS_INDEX).toHaveLength(routesWithMetadata.size);
  });

  it("the one non-content route (/docs) redirects to an indexed route", () => {
    const [[route, target]] = [...redirectRoutes.entries()];
    expect(route).toBe("/docs");
    expect(target).toBe("/docs/getting-started");
    expect(indexedRoutes.has(target)).toBe(true);
  });

  it("the dynamic [version] route resolves versions (issue #127)", () => {
    const [[route, source]] = [...dynamicRoutes.entries()];
    expect(route).toBe("/docs/[version]");
    // Resolves version slugs, redirects the current line to canonical
    // /docs, and renders archived snapshots (never a silent 404).
    expect(source).toContain("resolveDocsVersion");
    expect(source).toContain("permanentRedirect(\"/docs\")");
    expect(source).toContain("notFound()");
  });

  it("index titles/descriptions are sourced from the page metadata", () => {
    for (const entry of DOCS_INDEX) {
      const source = routesWithMetadata.get(entry.route);
      expect(source, `${entry.route} must be a walked page`).toBeTruthy();
      // The metadata title is "<entry.title> — RoyCSS Docs".
      expect(source).toContain(`title: "${entry.title} — RoyCSS Docs"`);
      // Description prefix (24 chars) — long enough to prove provenance,
      // short enough to stop before any ${...} interpolation placeholder.
      expect(source).toContain(entry.description.slice(0, 24));
    }
  });
});

/* ─── 2. Integrity ────────────────────────────────────────────── */

describe("docs-index: entry integrity", () => {
  const SECTIONS = ["getting-started", "concepts", "api", "guides"];
  const SECTION_LABELS: Record<string, string> = {
    "getting-started": "Getting Started",
    concepts: "Concepts",
    api: "API Reference",
    guides: "Guides",
  };

  it("every entry has a title, description, real /docs route, and keywords", () => {
    for (const entry of DOCS_INDEX) {
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.description.trim().length).toBeGreaterThan(0);
      expect(entry.route.startsWith("/docs/")).toBe(true);
      expect(SECTIONS).toContain(entry.section);
      expect(entry.sectionLabel).toBe(SECTION_LABELS[entry.section]);
      expect(Array.isArray(entry.keywords)).toBe(true);
      expect(entry.keywords.length).toBeGreaterThan(0);
      for (const k of entry.keywords) {
        expect(k).toBe(k.toLowerCase());
        expect(k.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("routes are unique", () => {
    const routes = DOCS_INDEX.map((e) => e.route);
    expect(new Set(routes).size).toBe(routes.length);
  });
});

/* ─── 3. Retirement is permanent ──────────────────────────────── */

describe("docs-index: the retired blob surfaces stay deleted", () => {
  const RETIRED_FILES = [
    // The 820 KB generated blob (full markdown bodies).
    "src/lib/docs-data.ts",
    // The 856 KB JSON blob + its lazy accessor family (dead DocsOverlay).
    "src/components/docs/docs-content.json",
    "src/components/docs/docs-data.ts",
    "src/components/docs/docs-overlay.tsx",
    "src/components/docs/docs-search.tsx",
    "src/components/docs/docs-sidebar.tsx",
    "src/components/docs/docs-toc.tsx",
    "src/components/docs/docs-content.tsx",
    // The retired DocsViewer sheet itself + its dead taxonomy twin.
    "src/components/roycss/docs-viewer.tsx",
    "src/components/roycss/docs-data.ts",
    // The generator of the deleted JSON blob.
    "scripts/build-docs.ts",
  ];

  it("no blob file exists", () => {
    const resurrected = RETIRED_FILES.filter((rel) => existsSync(join(ROOT, rel)));
    expect(resurrected).toEqual([]);
  });

  it("nothing imports the retired blobs or the docs sheet", () => {
    const offenders: string[] = [];
    // Matches import specifiers (static `from "..."` / dynamic `import("...")`)
    // that resolve to any retired docs module. Scoped to import statements so
    // DOM-selector strings like "[data-docs-content]" (DocsTOC.tsx) don't trip it.
    const RETIRED_IMPORT =
      /(?:from\s+|import\(\s*)["'][^"']*docs-(?:data|viewer|content|overlay|search)(?:\.json)?["']/;
    const scan = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        const abs = join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(abs);
        } else if (/\.(tsx?|json)$/.test(entry.name)) {
          const src = readFileSync(abs, "utf8");
          if (RETIRED_IMPORT.test(src)) {
            offenders.push(relative(ROOT, abs));
          }
        }
      }
    };
    scan(join(ROOT, "src"));
    scan(join(ROOT, "tests"));
    expect(offenders).toEqual([]);
  });
});

/* ─── 4. Slimness ────────────────────────────────────────────── */

describe("docs-index: the index stays slim", () => {
  it("is under 20 KB (replaced 1,676,060 bytes of blobs)", () => {
    const bytes = readFileSync(INDEX_FILE, "utf8").length;
    expect(bytes).toBeLessThan(20 * 1024);
  });
});

/* ─── 5. Search behavior ─────────────────────────────────────── */

describe("docs-index: searchDocs", () => {
  it("returns nothing for an empty query", () => {
    expect(searchDocs("")).toEqual([]);
    expect(searchDocs("   ")).toEqual([]);
  });

  it("matches by title, keyword, and description and returns real routes", () => {
    const byTitle = searchDocs("oklch");
    expect(byTitle.map((e) => e.route)).toContain("/docs/concepts/oklch-colors");

    const byKeyword = searchDocs("a11y");
    expect(byKeyword.map((e) => e.route)).toContain("/docs/concepts/accessibility");

    const byDescription = searchDocs("kebab-case");
    expect(byDescription.map((e) => e.route)).toContain("/docs/concepts/class-naming");

    const byRoute = searchDocs("tree-shaking");
    expect(byRoute.map((e) => e.route)).toContain("/docs/guides/tree-shaking");
  });

  it("respects the limit", () => {
    const all: DocsIndexEntry[] = searchDocs("effect", 100);
    expect(all.length).toBeGreaterThan(5);
    expect(searchDocs("effect", 3)).toHaveLength(3);
  });
});

/* ─── 6. Wiring (source-level, heavy client trees) ────────────── */

describe("docs-index: navbar / overlay wiring points at the /docs routes", () => {
  const pageSource = readFileSync(
    resolve(__dirname, "../../src/components/roycss/roycss-page.tsx"),
    "utf8",
  );
  const overlaySource = readFileSync(
    resolve(__dirname, "../../src/components/roycss/search-overlay.tsx"),
    "utf8",
  );

  it("roycss-page links Docs to /docs/getting-started (navbar, mobile menu, footer)", () => {
    const matches = pageSource.match(/href="\/docs\/getting-started"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("roycss-page no longer mounts the DocsViewer sheet", () => {
    expect(pageSource).not.toContain("DocsViewer");
    expect(pageSource).not.toContain("setDocsOpen");
    expect(pageSource).not.toContain("docsOpen");
  });

  it("the lazy docs-sheet chunk import is gone", () => {
    // Concatenated so this test file does not itself contain the retired
    // import specifier that the repo-wide scan above flags.
    const retiredImport = 'import("@/components/roycss/docs-' + 'viewer")';
    expect(pageSource).not.toContain(retiredImport);
  });

  it("the search overlay consumes the slim docs index and links results to /docs routes", () => {
    expect(overlaySource).toContain('from "@/lib/docs-index"');
    expect(overlaySource).toContain("searchDocs");
    expect(overlaySource).toMatch(/docsResults\.map[\s\S]*?<Link key=\{d\.route\} href=\{d\.route\}/);
  });
});
