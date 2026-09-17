/**
 * RoyCSS Docs Index Generator (slim)
 * ─────────────────────────────────────────────────────────────────
 * Walks the REAL /docs route pages under src/app/docs/** and emits a
 * slim, typed search index at src/lib/docs-index.ts.
 *
 * The /docs routes are the single source of truth for documentation
 * (issue #112 / UIX-F11). Each route page exports a Next.js
 * `metadata` object (title + description); this script reads those
 * exports once at generation time so the client-side search overlay
 * never needs the filesystem or the page bodies at runtime.
 *
 * Usage:
 *   bun run scripts/generate-docs-index.ts
 *
 * Re-run whenever a /docs route is added/renamed or its metadata
 * changes, then commit the regenerated file (it is checked in —
 * no fs walking ships in client bundles).
 *
 * Template-literal descriptions that interpolate site-stats constants
 * (e.g. `${EFFECT_COUNT_FORMATTED}`) are resolved by importing
 * src/lib/site-stats.ts at generation time.
 *
 * Output shape (src/lib/docs-index.ts):
 *   interface DocsIndexEntry { route, title, section, sectionLabel, description, keywords }
 *   const DOCS_INDEX: DocsIndexEntry[]
 *   function searchDocs(query, limit): DocsIndexEntry[]
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative } from "path";
import * as siteStats from "../src/lib/site-stats";

const ROOT = import.meta.dir + "/..";
const DOCS_DIR = join(ROOT, "src", "app", "docs");
const OUT_FILE = join(ROOT, "src", "lib", "docs-index.ts");

/* ─── Section taxonomy (first route segment → label) ────────────
   Mirrors src/lib/docs-sitemap.ts category labels so search results
   carry the same section vocabulary as the docs sidebar. */
const SECTION_LABELS: Record<string, string> = {
  "getting-started": "Getting Started",
  concepts: "Concepts",
  api: "API Reference",
  guides: "Guides",
};

const SECTION_ORDER = ["getting-started", "concepts", "api", "guides"];

/* Curated search synonyms: extra keywords beyond title/route tokens.
   Keep this small and obvious — the index must stay under 20 KB. */
const EXTRA_KEYWORDS: Record<string, string[]> = {
  "/docs/getting-started/mcp-server": ["ai", "assistant", "claude", "cursor", "copilot"],
  "/docs/getting-started/cli": ["command line", "terminal", "npx"],
  "/docs/getting-started/vscode-snippets": ["editor", "extension", "autocomplete"],
  "/docs/concepts/accessibility": ["a11y", "wcag", "reduced motion", "screen reader"],
  "/docs/concepts/oklch-colors": ["color", "perceptual", "palette"],
  "/docs/concepts/browser-support": ["fallbacks", "supports", "compatibility"],
  "/docs/concepts/performance": ["gpu", "fast", "optimization"],
  "/docs/api/effects": ["classes", "reference"],
  "/docs/guides/migration": ["animate css", "gsap", "framer"],
  "/docs/guides/theming": ["brand", "dark mode", "theme"],
  "/docs/guides/tree-shaking": ["bundle", "subset", "size"],
  "/docs/guides/performance-optimization": ["critical css", "layers", "benchmark"],
  "/docs/guides/ai-workflow": ["prompts", "mcp", "llm"],
};

/* Tokens that carry no search signal. */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "your", "with", "for",
  "in", "on", "how", "why", "what", "is", "it", "from", "by", "roycss",
]);

/* ─── Route walking ───────────────────────────────────────────── */

function walkPages(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPages(abs, out);
    } else if (entry.name === "page.tsx") {
      out.push(abs);
    }
  }
}

function routeFromPath(absPath: string): string {
  let rel = relative(DOCS_DIR, absPath);
  rel = rel.replace(/(^|[/\\])page\.tsx$/, "");
  return rel ? `/docs/${rel.replace(/\\/g, "/")}` : "/docs";
}

/* ─── Metadata extraction ─────────────────────────────────────── */

/** Extract a double-quoted or backtick metadata string property. */
function extractMetadataString(source: string, prop: string): string | null {
  // Matches `prop: "double quoted"` or `prop:` + newline/spaces + `` `template` ``.
  const propRe = new RegExp(
    prop + ':\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|`([^`]*)`)',
    "m",
  );
  const m = source.match(propRe);
  if (!m) return null;
  const raw = m[1] !== undefined ? m[1] : m[2];
  if (m[1] !== undefined) {
    // Double-quoted string: unescape \" and \\.
    return raw.replace(/\\(")/g, "$1").replace(/\\\\/g, "\\");
  }
  // Backtick template literal: resolve ${VAR} against site-stats.
  return raw.replace(/\$\{(\w+)\}/g, (_, name: string) => {
    const value = (siteStats as unknown as Record<string, unknown>)[name];
    if (typeof value !== "string" && typeof value !== "number") {
      throw new Error(
        `docs metadata template literal references unknown site-stats export: \${${name}} — extend the generator.`,
      );
    }
    return String(value);
  });
}

/* ─── Keyword derivation ──────────────────────────────────────── */

function keywordsFor(route: string, title: string): string[] {
  const leaf = route.split("/").filter(Boolean).pop() ?? "";
  const tokens = [...leaf.split("-"), ...title.toLowerCase().split(/[\s—-]+/)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    const word = t.trim().toLowerCase();
    if (!word || word.length < 2 || STOPWORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  for (const extra of EXTRA_KEYWORDS[route] ?? []) {
    if (!seen.has(extra)) {
      seen.add(extra);
      out.push(extra);
    }
  }
  return out.slice(0, 10);
}

/* ─── Main ───────────────────────────────────────────────────── */

function main(): void {
  const pageFiles: string[] = [];
  walkPages(DOCS_DIR, pageFiles);

  type Entry = {
    route: string;
    title: string;
    section: string;
    sectionLabel: string;
    description: string;
    keywords: string[];
  };

  const entries: Entry[] = [];
  const redirects: string[] = [];

  for (const abs of pageFiles) {
    const route = routeFromPath(abs);
    const source = readFileSync(abs, "utf8");

    if (!/export const metadata/.test(source)) {
      // No metadata → not a content page. Must be a redirect (e.g. /docs → /docs/getting-started).
      const redirectMatch = source.match(/redirect\(\s*"([^"]+)"\s*\)/);
      if (!redirectMatch) {
        throw new Error(`${route}: page has no metadata and no redirect() — resolve manually.`);
      }
      redirects.push(`${route} → ${redirectMatch[1]}`);
      continue;
    }

    const rawTitle = extractMetadataString(source, "title");
    const description = extractMetadataString(source, "description");
    if (!rawTitle || !description) {
      throw new Error(`${route}: could not extract metadata title/description.`);
    }

    // Titles follow the "Page — RoyCSS Docs" convention; strip the suffix.
    const title = rawTitle.replace(/\s*—\s*RoyCSS\s*Docs\s*$/, "").trim();

    const section = route.split("/")[2] ?? "";
    const sectionLabel = SECTION_LABELS[section];
    if (!sectionLabel) {
      throw new Error(`${route}: unknown section "${section}" — add it to SECTION_LABELS.`);
    }

    entries.push({
      route,
      title,
      section,
      sectionLabel,
      description,
      keywords: keywordsFor(route, title),
    });
  }

  // Canonical order: docs-site section order, then route depth, then A–Z.
  entries.sort((a, b) => {
    const sa = SECTION_ORDER.indexOf(a.section);
    const sb = SECTION_ORDER.indexOf(b.section);
    if (sa !== sb) return sa - sb;
    const da = a.route.split("/").length;
    const db = b.route.split("/").length;
    if (da !== db) return da - db;
    return a.route.localeCompare(b.route);
  });

  /* ─── Emit the TS module ─────────────────────────────────── */

  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * RoyCSS Docs Search Index — GENERATED FILE. DO NOT EDIT BY HAND.");
  lines.push(" *");
  lines.push(" * Regenerate with:  bun run scripts/generate-docs-index.ts");
  lines.push(" *");
  lines.push(" * Source: the real /docs route pages (every page.tsx under src/app/docs —");
  lines.push(" * their metadata exports: title/description). The /docs routes are the single");
  lines.push(" * source of truth for documentation (issue #112): this slim index exists only");
  lines.push(" * so the client-side search overlay can offer docs results WITHOUT shipping");
  lines.push(" * page bodies or walking the filesystem at runtime.");
  lines.push(" *");
  lines.push(` * Entries: ${entries.length} content routes (${redirects.length} redirect route${redirects.length === 1 ? "" : "s"} skipped:`);
  for (const r of redirects) lines.push(` *   ${r}`);
  lines.push(" * ).");
  lines.push(" */");
  lines.push("");
  lines.push("export interface DocsIndexEntry {");
  lines.push("  /** Absolute route path, e.g. \"/docs/concepts/oklch-colors\". */");
  lines.push("  route: string;");
  lines.push("  /** Page title (metadata title minus the \"— RoyCSS Docs\" suffix). */");
  lines.push("  title: string;");
  lines.push("  /** Route section id, e.g. \"concepts\". */");
  lines.push("  section: string;");
  lines.push("  /** Human-readable section label, e.g. \"Concepts\". */");
  lines.push("  sectionLabel: string;");
  lines.push("  /** One-line description from the page metadata (search preview snippet). */");
  lines.push("  description: string;");
  lines.push("  /** Lowercase search keywords derived from the route, title, and synonyms. */");
  lines.push("  keywords: string[];");
  lines.push("}");
  lines.push("");
  lines.push("export const DOCS_INDEX: DocsIndexEntry[] = [");
  for (const e of entries) {
    lines.push("  {");
    lines.push(`    route: ${JSON.stringify(e.route)},`);
    lines.push(`    title: ${JSON.stringify(e.title)},`);
    lines.push(`    section: ${JSON.stringify(e.section)},`);
    lines.push(`    sectionLabel: ${JSON.stringify(e.sectionLabel)},`);
    lines.push(`    description: ${JSON.stringify(e.description)},`);
    lines.push(`    keywords: ${JSON.stringify(e.keywords)},`);
    lines.push("  },");
  }
  lines.push("];");
  lines.push("");
  lines.push("/**");
  lines.push(" * Search the docs index by title / description / keywords / route.");
  lines.push(" *");
  lines.push(" * Honest scope (issue #112): the retired DocsViewer sheet searched full");
  lines.push(" * markdown bodies; this index covers title + description + keywords only.");
  lines.push(" * Matching mirrors the search overlay's other groups (substring,");
  lines.push(" * case-insensitive), ranked in canonical docs order.");
  lines.push(" */");
  lines.push("export function searchDocs(query: string, limit = 5): DocsIndexEntry[] {");
  lines.push("  const q = query.trim().toLowerCase();");
  lines.push("  if (!q) return [];");
  lines.push("  return DOCS_INDEX.filter((entry) => {");
  lines.push("    return (");
  lines.push("      entry.title.toLowerCase().includes(q) ||");
  lines.push("      entry.description.toLowerCase().includes(q) ||");
  lines.push("      entry.keywords.some((k) => k.includes(q)) ||");
  lines.push("      entry.route.toLowerCase().includes(q)");
  lines.push("    );");
  lines.push("  }).slice(0, limit);");
  lines.push("}");

  const out = lines.join("\n") + "\n";
  writeFileSync(OUT_FILE, out, "utf8");

  console.log(`Found ${pageFiles.length} /docs route pages (${entries.length} content, ${redirects.length} redirect).`);
  for (const r of redirects) console.log(`  redirect: ${r}`);
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`  ${entries.length} entries, ${out.length.toLocaleString()} bytes (${(out.length / 1024).toFixed(1)} KB)`);
}

main();
