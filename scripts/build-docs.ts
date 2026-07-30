/**
 * RoyCSS Documentation Build Script
 *
 * Reads all 19 markdown architecture documents from /docs/ and compiles them
 * into a single JSON artifact at src/components/docs/docs-content.json.
 *
 * The JSON is lazy-loaded by the docs overlay at runtime (see ADR 03-docs-site).
 *
 * Usage:
 *   bun run scripts/build-docs.ts
 *
 * Output shape:
 *   Array<{
 *     slug: string;            // kebab-case filename without extension
 *     title: string;           // first H1 heading text
 *     category: string;        // "architecture" | "product" | "quality" | "growth" | "tooling"
 *     categoryLabel: string;   // "Architecture" | "Product" | ...
 *     description: string;     // first non-metadata paragraph after H1, truncated to 200 chars
 *     content: string;         // full markdown source (untouched)
 *     toc: Array<{ id: string; text: string; level: number }>;  // H2 headings
 *     wordCount: number;
 *   }>
 *
 * See:
 *   - docs/adr/03-docs-site.md
 *   - docs/threat-models/03-docs-site.md
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from "fs";
import { join, basename, extname } from "path";

const ROOT = import.meta.dir + "/..";
const DOCS_DIR = join(ROOT, "docs");
const OUT_DIR = join(ROOT, "src", "components", "docs");
const OUT_FILE = join(OUT_DIR, "docs-content.json");

/* ─── Category mapping (filename prefix → category) ────────────
   Based on ADR §2.4. Order matters: first match wins (so e.g.
   "LABS-26" matches "LABS-26" before the broader "LABS-" fallback). */
const CATEGORY_MAP: Array<{ prefixes: string[]; category: string; label: string }> = [
  {
    prefixes: ["LABS-26", "LABS-27", "LABS-34", "LABS-35", "FIRST-PRINCIPLES-REDESIGN", "ROYCSS-V2-BLUEPRINT"],
    category: "architecture",
    label: "Architecture",
  },
  {
    prefixes: ["PLATFORM-VISION", "ENTERPRISE-REVIEW", "COMPETITIVE-ANALYSIS", "50-ORIGINAL-FEATURES"],
    category: "product",
    label: "Product",
  },
  {
    prefixes: ["LABS-28", "LABS-29", "LABS-32", "LABS-33"],
    category: "quality",
    label: "Quality",
  },
  {
    prefixes: ["LABS-30", "LABS-31", "LABS-36"],
    category: "growth",
    label: "Growth",
  },
  {
    prefixes: ["DOCUMENTATION-SITE", "VSCODE-EXTENSION"],
    category: "tooling",
    label: "Tooling",
  },
];

/* ─── Explicit allowlist of doc filename prefixes ───────────────
   Rather than globbing *.md (which would include ADRs, threat models,
   plans, benchmarks, checklists, and scratch notes), we use an explicit
   allowlist of filename prefixes derived from the category map. A file
   is included iff its base name (without .md) equals a prefix OR starts
   with `<prefix>-`. This is defense-in-depth against accidentally
   leaking internal-only docs into the public JSON.
   See threat-models/03-docs-site.md §T6. */
const ALLOWED_PREFIXES: string[] = CATEGORY_MAP.flatMap((c) => c.prefixes);

function isAllowedDoc(filename: string): boolean {
  const base = filename.replace(/\.md$/, "");
  return ALLOWED_PREFIXES.some((p) => base === p || base.startsWith(p + "-"));
}

/* ─── Helpers ─────────────────────────────────────────────────── */

/** Slugify a heading text into a URL-safe ID.
 *  Matches the algorithm used by GitHub's anchor generation and the
 *  rehype-slug runtime plugin, so build-time TOC IDs === runtime H2 IDs.
 *  See threat-models/03-docs-site.md §T3 — output is restricted to [a-z0-9-]. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // strip punctuation (also strips <, >, ", ')
    .replace(/\s+/g, "-") // collapse whitespace to single hyphen
    .replace(/-+/g, "-") // collapse repeated hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

/** Extract the H1 title from a markdown string.
 *  Returns "Untitled" if no H1 is found. */
function extractTitle(md: string): string {
  const lines = md.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      return trimmed.slice(2).trim();
    }
  }
  return "Untitled";
}

/** Extract a description: first non-empty paragraph after the H1 that is NOT
 *  a metadata line (i.e., doesn't start with `**` or `>` or `---`).
 *  Truncated to 200 chars with an ellipsis. */
function extractDescription(md: string): string {
  const lines = md.split("\n");
  let seenH1 = false;
  let paragraph: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!seenH1) {
      if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) seenH1 = true;
      continue;
    }
    // Skip metadata lines: bold `**Field:** value`, blockquotes, hrules, headings, empty lines
    if (
      trimmed === "" ||
      trimmed === "---" ||
      trimmed.startsWith("**") ||
      trimmed.startsWith(">") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("|")
    ) {
      if (paragraph.length > 0) break;
      continue;
    }
    paragraph.push(trimmed);
    if (paragraph.length >= 3) break;
  }

  const text = paragraph.join(" ");
  if (text.length <= 200) return text;
  return text.slice(0, 197).trimEnd() + "...";
}

/** Extract all H2 headings (## ...) as TOC entries.
 *  Skips headings inside fenced code blocks (```...```). */
function extractToc(md: string): Array<{ id: string; text: string; level: number }> {
  const lines = md.split("\n");
  const toc: Array<{ id: string; text: string; level: number }> = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Match H2 only (## ) — not H3+ or H1
    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      const text = h2Match[1].trim();
      // Skip "Table of Contents" entries that are auto-generated
      if (text.toLowerCase() === "table of contents") continue;
      toc.push({ id: slugify(text), text, level: 2 });
    }
  }

  return toc;
}

/** Categorize a doc by filename. Returns "Uncategorized" if no prefix matches. */
function categorize(filename: string): { category: string; label: string } {
  const base = filename.replace(/\.md$/, "");
  for (const entry of CATEGORY_MAP) {
    if (entry.prefixes.some((p) => base === p || base.startsWith(p + "-"))) {
      return { category: entry.category, label: entry.label };
    }
  }
  return { category: "uncategorized", label: "Uncategorized" };
}

/* ─── Main ───────────────────────────────────────────────────── */

interface DocEntry {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  description: string;
  content: string;
  toc: Array<{ id: string; text: string; level: number }>;
  wordCount: number;
}

function main() {
  console.log("━".repeat(60));
  console.log("RoyCSS Documentation Build");
  console.log("━".repeat(60));
  console.log(`Source dir: ${DOCS_DIR}`);
  console.log(`Output:     ${OUT_FILE}`);
  console.log();

  // Verify docs dir
  if (!existsSync(DOCS_DIR)) {
    console.error(`✗ Docs directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  // List all .md files in docs/ (top-level only — not subdirs)
  const allMdFiles = readdirSync(DOCS_DIR).filter((f) => {
    const full = join(DOCS_DIR, f);
    return statSync(full).isFile() && extname(f) === ".md";
  });

  console.log(`Found ${allMdFiles.length} .md files in docs/:`);
  for (const f of allMdFiles.sort()) {
    const allowed = isAllowedDoc(f);
    console.log(`  ${allowed ? "✓" : "✗"} ${f}`);
  }
  console.log();

  // Filter to allowlist
  const includedFiles = allMdFiles.filter((f) => isAllowedDoc(f));
  const excludedFiles = allMdFiles.filter((f) => !isAllowedDoc(f));

  if (excludedFiles.length > 0) {
    console.log(`Excluded ${excludedFiles.length} non-design-doc .md files:`);
    for (const f of excludedFiles.sort()) console.log(`  - ${f}`);
    console.log();
  }

  // Build entries
  const entries: DocEntry[] = [];
  for (const filename of includedFiles.sort()) {
    const fullPath = join(DOCS_DIR, filename);
    const content = readFileSync(fullPath, "utf-8");
    const slug = filename.replace(/\.md$/, "").toLowerCase();
    const title = extractTitle(content);
    const description = extractDescription(content);
    const toc = extractToc(content);
    const { category, label } = categorize(filename);
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    entries.push({
      slug,
      title,
      category,
      categoryLabel: label,
      description,
      content,
      toc,
      wordCount,
    });

    console.log(`  ✓ ${filename}`);
    console.log(`    title:    "${title}"`);
    console.log(`    category: ${category} (${label})`);
    console.log(`    words:    ${wordCount.toLocaleString()}`);
    console.log(`    toc:      ${toc.length} H2 sections`);
    console.log();
  }

  // Sort entries by category order, then alphabetically within category
  const categoryOrder = CATEGORY_MAP.map((c) => c.category);
  entries.sort((a, b) => {
    const ca = categoryOrder.indexOf(a.category);
    const cb = categoryOrder.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.title.localeCompare(b.title);
  });

  // Ensure output directory
  mkdirSync(OUT_DIR, { recursive: true });

  // Write JSON
  const json = JSON.stringify(entries, null, 2);
  writeFileSync(OUT_FILE, json, "utf-8");

  const totalBytes = Buffer.byteLength(json, "utf-8");
  const totalKb = (totalBytes / 1024).toFixed(1);
  const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);

  console.log("━".repeat(60));
  console.log("Build complete.");
  console.log(`  Docs included: ${entries.length}`);
  console.log(`  Total words:   ${totalWords.toLocaleString()}`);
  console.log(`  Output size:   ${totalKb} KB (${totalBytes.toLocaleString()} bytes)`);
  console.log(`  Output file:   ${OUT_FILE}`);
  console.log("━".repeat(60));

  // Sanity checks
  if (entries.length !== ALLOWED_PREFIXES.length) {
    const included = new Set(includedFiles.map((f) => f.replace(/\.md$/, "")));
    const missing = ALLOWED_PREFIXES.filter((p) => {
      // a prefix is "missing" if no included file matches it
      return !included.has(p) && !includedFiles.some((f) => f.replace(/\.md$/, "").startsWith(p + "-"));
    });
    console.warn(
      `⚠ Warning: expected ${ALLOWED_PREFIXES.length} docs, got ${entries.length}. ` +
        (missing.length > 0 ? `Missing: ${missing.join(", ")}` : ""),
    );
  }

  const uncategorized = entries.filter((e) => e.category === "uncategorized");
  if (uncategorized.length > 0) {
    console.warn(
      `⚠ Warning: ${uncategorized.length} docs are uncategorized: ` +
        uncategorized.map((e) => e.slug).join(", "),
    );
  }
}

main();
