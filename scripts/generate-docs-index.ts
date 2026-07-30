/**
 * RoyCSS Documentation Index Generator
 *
 * Reads all top-level markdown files from /docs/*.md and emits a TypeScript
 * module at src/lib/docs-data.ts that the in-app DocsViewer imports at
 * build time. This avoids any filesystem access at runtime in the browser
 * (the viewer is a client component).
 *
 * Usage:
 *   bun run scripts/generate-docs-index.ts
 *
 * Output: src/lib/docs-data.ts exporting:
 *   interface DocEntry { slug, title, category, categoryLabel, description, wordCount, content }
 *   const docsIndex: DocEntry[]
 *
 * Re-run whenever docs/*.md changes. The generated file is checked in.
 *
 * See: docs/adr/documentation-viewer/ADR.md §ADR-005
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";

const ROOT = import.meta.dir + "/..";
const DOCS_DIR = join(ROOT, "docs");
const OUT_FILE = join(ROOT, "src", "lib", "docs-data.ts");

/* ─── Category mapping (filename prefix → category) ─────────────
   Mirrors scripts/build-docs.ts so the in-app viewer and the docs-overlay
   pipeline use the same taxonomy. Order matters: first match wins. */
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

function classify(filename: string): { category: string; label: string } {
  const base = filename.replace(/\.md$/, "");
  for (const c of CATEGORY_MAP) {
    if (c.prefixes.some((p) => base === p || base.startsWith(p + "-"))) {
      return { category: c.category, label: c.label };
    }
  }
  return { category: "other", label: "Other" };
}

/* ─── Helpers ────────────────────────────────────────────────── */

function extractTitle(content: string, filename: string): string {
  const m = content.match(/^#\s+(.+?)\s*$/m);
  if (m) return m[1].trim();
  // Fallback: prettify filename
  return basename(filename, ".md")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractDescription(content: string): string {
  const lines = content.split("\n");
  let pastH1 = false;
  let pastMetadata = false;
  let metadataBlankSeen = false;
  const desc: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) { pastH1 = true; continue; }
    if (!pastH1) continue;

    // Skip metadata lines like **Status:** / **Version:** / **Author:**
    if (/^\*\*\w+:\*\*/.test(trimmed)) { pastMetadata = false; continue; }
    // Skip blockquotes ("> Rule of this document")
    if (trimmed.startsWith(">")) continue;
    // Skip horizontal rules
    if (/^---+$/.test(trimmed)) { continue; }
    // Skip empty lines but track them
    if (trimmed === "") {
      if (pastMetadata) metadataBlankSeen = true;
      continue;
    }

    // First real paragraph after H1 + metadata
    pastMetadata = true;
    if (desc.length === 0 || (desc.length < 3 && !metadataBlankSeen)) {
      desc.push(trimmed);
      if (desc.join(" ").length >= 180) break;
    } else {
      break;
    }
  }

  let text = desc.join(" ");
  // Strip markdown emphasis
  text = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
  // Strip inline code backticks
  text = text.replace(/`([^`]+)`/g, "$1");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  if (text.length > 180) text = text.slice(0, 177) + "…";
  return text || "(No description available.)";
}

function countWords(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

/* Escape a string so it can be embedded as the body of a template literal.
   Backticks and ${ would break the literal; backslashes are fine since
   template literals only special-case backtick, $, and \. */
function escapeTemplateLiteral(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

/* ─── Main ───────────────────────────────────────────────────── */

function main() {
  const files = readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => statSync(join(DOCS_DIR, f)).isFile())
    .sort();

  console.log(`Found ${files.length} markdown files in docs/`);

  const entries = files.map((filename) => {
    const filepath = join(DOCS_DIR, filename);
    const content = readFileSync(filepath, "utf8");
    const slug = basename(filename, ".md").toLowerCase();
    const title = extractTitle(content, filename);
    const { category, label } = classify(filename);
    const description = extractDescription(content);
    const wordCount = countWords(content);
    return { slug, title, category, categoryLabel: label, description, wordCount, content, filename };
  });

  // Sort by category label, then title (case-insensitive)
  entries.sort((a, b) => {
    if (a.categoryLabel !== b.categoryLabel) {
      return a.categoryLabel.localeCompare(b.categoryLabel);
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });

  // Log a summary for verification
  console.log("\nDoc index:");
  for (const e of entries) {
    console.log(`  [${e.categoryLabel.padEnd(12)}] ${e.slug.padEnd(40)} ${String(e.wordCount).padStart(6)} words`);
  }

  // Emit the TS module
  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * RoyCSS Documentation Index — GENERATED FILE. DO NOT EDIT BY HAND.");
  lines.push(" *");
  lines.push(" * Regenerate with:  bun run scripts/generate-docs-index.ts");
  lines.push(" *");
  lines.push(" * Source: docs/*.md (19 top-level architecture / lab / blueprint documents).");
  lines.push(" * Consumer: src/components/roycss/docs-viewer.tsx (the in-app Docs Sheet).");
  lines.push(" *");
  lines.push(" * See docs/adr/documentation-viewer/ADR.md §ADR-005 for the design rationale.");
  lines.push(" */");
  lines.push("");
  lines.push("export interface DocEntry {");
  lines.push("  slug: string;");
  lines.push("  title: string;");
  lines.push("  category: string;");
  lines.push("  categoryLabel: string;");
  lines.push("  description: string;");
  lines.push("  wordCount: number;");
  lines.push("  content: string;");
  lines.push("}");
  lines.push("");
  lines.push("export const docsIndex: DocEntry[] = [");

  for (const e of entries) {
    lines.push("  {");
    lines.push(`    slug: ${JSON.stringify(e.slug)},`);
    lines.push(`    title: ${JSON.stringify(e.title)},`);
    lines.push(`    category: ${JSON.stringify(e.category)},`);
    lines.push(`    categoryLabel: ${JSON.stringify(e.categoryLabel)},`);
    lines.push(`    description: ${JSON.stringify(e.description)},`);
    lines.push(`    wordCount: ${e.wordCount},`);
    lines.push(`    content: \`${escapeTemplateLiteral(e.content)}\`,`);
    lines.push("  },");
  }

  lines.push("];");
  lines.push("");

  writeFileSync(OUT_FILE, lines.join("\n"), "utf8");
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(`  ${entries.length} entries, ${lines.join("\n").length.toLocaleString()} bytes`);
}

main();
