#!/usr/bin/env bun
/**
 * RoyCSS release — changelog generator.
 *
 * Assembles the root CHANGELOG.md from:
 *
 *   1. Manual entry files in scripts/release/changelog-entries/*.md
 *      Each file has YAML frontmatter:
 *
 *        ---
 *        type: added        # one of: added|changed|deprecated|removed|fixed|security
 *        pr: 142            # GitHub PR number (used for linkification)
 *        ---
 *
 *        Added 12 new glassmorphism effects to the glass-ui category.
 *        New ids: roycss-glass-frost, roycss-glass-aurora, …
 *
 *      These become bullets under the matching sub-section of the
 *      [Unreleased] section.
 *
 *   2. The existing CHANGELOG.md — all previously-released sections
 *      ([1.0.0], [1.1.0], …) are preserved verbatim.
 *
 *   3. Footer link definitions — [Unreleased]: .../compare/v<last>...HEAD
 *      and [<version>]: .../releases/tag/v<version> for each released
 *      version. The link definitions are maintained automatically.
 *
 * Entry files starting with `_` (e.g. `_EXAMPLE.md`, `_README.md`) are
 * skipped — they're documentation, not changes.
 *
 * Consumed entry files are moved to changelog-entries/consumed/ (with a
 * timestamp prefix) so they don't get re-emitted on the next run.
 *
 * Usage:
 *
 *   bun run scripts/release/generate-changelog.ts
 *
 * Exit codes:
 *   0 — CHANGELOG.md assembled (or no entries found and no work to do)
 *   1 — bad frontmatter, invalid type, write failure
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
} from "node:fs";
import { join, basename } from "node:path";
import {
  CHANGELOG_PATH,
  CHANGELOG_ENTRIES_DIR,
  CHANGELOG_CONSUMED_DIR,
  CHANGELOG_SECTIONS,
  GITHUB_URL,
  C,
  ok,
  warn,
  fail,
  banner,
  type ChangelogSection,
} from "./release.config";

// ── Frontmatter parsing ─────────────────────────────────────────────
interface Entry {
  file: string;
  type: ChangelogSection;
  pr: number | null;
  body: string;
}

const VALID_TYPES = new Set<string>(CHANGELOG_SECTIONS);

function parseFrontmatter(text: string): { fm: Record<string, string>; body: string } | null {
  // Must start with `---\n`. Find the closing `---` line.
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) return null;
  const lines = text.split(/\r?\n/);
  // lines[0] = "---"
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return null;
  const fmText = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n").trim();
  const fm: Record<string, string> = {};
  for (const line of fmText.split(/\r?\n/)) {
    const m = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(line);
    if (m) fm[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return { fm, body };
}

function readEntry(file: string, absPath: string): Entry | null {
  const text = readFileSync(absPath, "utf-8");
  const parsed = parseFrontmatter(text);
  if (!parsed) {
    fail(`${file}: missing or malformed YAML frontmatter (expected ---\\n...\\n---)`);
    return null;
  }
  const typeStr = parsed.fm.type?.toLowerCase();
  if (!typeStr || !VALID_TYPES.has(typeStr)) {
    fail(`${file}: invalid type "${parsed.fm.type ?? ""}" (must be one of: ${CHANGELOG_SECTIONS.join(", ")})`);
    return null;
  }
  const prStr = parsed.fm.pr;
  let pr: number | null = null;
  if (prStr !== undefined && prStr !== "") {
    const n = Number(prStr);
    if (!Number.isFinite(n) || n <= 0) {
      fail(`${file}: invalid pr "${prStr}" (must be a positive integer)`);
      return null;
    }
    pr = n;
  }
  if (!parsed.body) {
    fail(`${file}: empty body (frontmatter present but no markdown content)`);
    return null;
  }
  return { file, type: typeStr as ChangelogSection, pr, body: parsed.body };
}

// ── CHANGELOG.md parsing ────────────────────────────────────────────
/**
 * Split the existing CHANGELOG.md into:
 *   - header (everything before the first `## [` line)
 *   - released sections (each `## [x.y.z] — YYYY-MM-DD` block)
 *   - footer (link definitions at the bottom — `[name]: url` lines)
 *
 * The [Unreleased] section, if present, is dropped — we regenerate it
 * from the entry files. The released sections are preserved verbatim.
 */
interface ExistingChangelog {
  header: string;
  releasedSections: { heading: string; body: string }[];
  linkDefs: Map<string, string>;
}

function parseExistingChangelog(text: string): ExistingChangelog {
  const lines = text.split(/\r?\n/);
  let headerEnd = 0;
  let i = 0;
  // Header = everything before the first line matching `^## \[`.
  while (i < lines.length) {
    if (/^## \[/.test(lines[i])) break;
    i++;
  }
  headerEnd = i;
  const header = lines.slice(0, headerEnd).join("\n");

  // Walk through the sections.
  const releasedSections: { heading: string; body: string }[] = [];
  let current: { heading: string; bodyLines: string[] } | null = null;
  const linkDefs = new Map<string, string>();

  for (; i < lines.length; i++) {
    const line = lines[i];
    // Heading: `## [1.0.0] — 2026-07-28` or `## [Unreleased]`
    const headingMatch = /^## \[/.exec(line);
    if (headingMatch) {
      if (current) releasedSections.push({ heading: current.heading, body: current.bodyLines.join("\n").trimEnd() });
      current = { heading: line, bodyLines: [] };
      continue;
    }
    // Link definition at the bottom: `[Unreleased]: https://...` (only
    // when we're past all sections — i.e. the line is at column 0 and
    // starts with `[`).
    if (/^\[[^\]]+\]:\s/.test(line)) {
      if (current) {
        releasedSections.push({ heading: current.heading, body: current.bodyLines.join("\n").trimEnd() });
        current = null;
      }
      const m = /^\[([^\]]+)\]:\s*(.*)$/.exec(line);
      if (m) linkDefs.set(m[1], m[2]);
      continue;
    }
    if (current) current.bodyLines.push(line);
  }
  if (current) releasedSections.push({ heading: current.heading, body: current.bodyLines.join("\n").trimEnd() });

  return { header, releasedSections, linkDefs };
}

// ── Determine the latest released version ───────────────────────────
function latestReleasedVersion(sections: { heading: string }[]): string | null {
  // heading format: `## [1.0.0] — 2026-07-28`  or  `## [1.0.0]`
  for (const s of sections) {
    const m = /^## \[([0-9][^\]]*)\]/.exec(s.heading);
    if (m) return m[1];
  }
  return null;
}

// ── Emit ────────────────────────────────────────────────────────────
function emitUnreleased(entries: Entry[]): string | null {
  if (entries.length === 0) return null;
  const byType = new Map<ChangelogSection, Entry[]>();
  for (const t of CHANGELOG_SECTIONS) byType.set(t, []);
  for (const e of entries) byType.get(e.type)!.push(e);
  // Sort within each type by PR number ascending (PRs without a number go last).
  for (const list of byType.values()) {
    list.sort((a, b) => {
      if (a.pr === null && b.pr === null) return a.file.localeCompare(b.file);
      if (a.pr === null) return 1;
      if (b.pr === null) return -1;
      return a.pr - b.pr;
    });
  }
  const lines: string[] = ["## [Unreleased]", ""];
  for (const t of CHANGELOG_SECTIONS) {
    const list = byType.get(t)!;
    if (list.length === 0) continue;
    lines.push(`### ${t.charAt(0).toUpperCase()}${t.slice(1)}`);
    lines.push("");
    for (const e of list) {
      const prLink = e.pr ? ` ([#${e.pr}](${GITHUB_URL}/pull/${e.pr}))` : "";
      // Indent the body so multi-line entries read well; first line gets `- `.
      const bodyLines = e.body.split(/\r?\n/);
      const firstLine = `- ${bodyLines[0]}${prLink}`;
      const restLines = bodyLines.slice(1).map((l) => (l.trim() ? `  ${l}` : ""));
      lines.push(firstLine);
      for (const rl of restLines) lines.push(rl);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function emitLinkDefs(
  unreleasedEntries: Entry[],
  latestReleased: string | null,
  releasedVersions: string[],
): string {
  const lines: string[] = [];
  if (unreleasedEntries.length > 0) {
    const base = latestReleased ? `v${latestReleased}` : "v0.0.0";
    lines.push(`[Unreleased]: ${GITHUB_URL}/compare/${base}...HEAD`);
  }
  // Skip [Unreleased] in the releasedVersions loop — it's not a "released" version.
  for (const v of releasedVersions) {
    lines.push(`[${v}]: ${GITHUB_URL}/releases/tag/v${v}`);
  }
  return lines.join("\n");
}

// ── Main ────────────────────────────────────────────────────────────
function main(): void {
  banner("Generating CHANGELOG.md");

  // Step 1: read entry files.
  let entryFiles: string[] = [];
  if (existsSync(CHANGELOG_ENTRIES_DIR)) {
    entryFiles = readdirSync(CHANGELOG_ENTRIES_DIR)
      .filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== ".gitkeep")
      .sort();
  }
  const entries: Entry[] = [];
  for (const f of entryFiles) {
    const abs = join(CHANGELOG_ENTRIES_DIR, f);
    const e = readEntry(f, abs);
    if (!e) {
      // Error already logged. Continue collecting errors? No — fail fast on
      // the first bad entry so the maintainer fixes it before regenerating.
      process.exit(1);
    }
    entries.push(e);
  }

  if (entries.length === 0) {
    warn("no entry files found in changelog-entries/ (skipping files starting with _)");
    warn("CHANGELOG.md left untouched — nothing to assemble");
    console.log("");
    console.log(`${C.dim}  To add an entry, create a .md file in:${C.reset}`);
    console.log(`  ${C.cyan}${CHANGELOG_ENTRIES_DIR.replace(process.cwd() + "/", "")}/${C.reset}`);
    console.log("");
    console.log(`${C.dim}  See scripts/release/changelog-entries/_EXAMPLE.md for the template.${C.reset}`);
    process.exit(0);
  }

  // Step 2: read + parse the existing CHANGELOG.md.
  let existingText = "";
  if (existsSync(CHANGELOG_PATH)) {
    existingText = readFileSync(CHANGELOG_PATH, "utf-8");
  } else {
    // Bootstrap header if no changelog exists yet.
    existingText = `# Changelog

All notable changes to RoyCSS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
`;
  }
  const existing = parseExistingChangelog(existingText);

  const releasedVersions: string[] = existing.releasedSections
    .map((s) => /^## \[([0-9][^\]]*)\]/.exec(s.heading)?.[1])
    .filter((v): v is string => !!v);

  const latestReleased = latestReleasedVersion(existing.releasedSections);

  // Step 3: emit the new [Unreleased] section.
  const unreleasedSection = emitUnreleased(entries);
  if (!unreleasedSection) {
    warn("no entries to assemble — CHANGELOG.md left untouched");
    process.exit(0);
  }

  // Step 4: assemble the new CHANGELOG.md.
  const parts: string[] = [existing.header.trimEnd(), ""];
  parts.push(unreleasedSection.trimEnd());
  for (const s of existing.releasedSections) {
    parts.push("");
    parts.push(s.heading);
    if (s.body) parts.push(s.body);
  }
  // Footer: link definitions.
  const linkDefs = emitLinkDefs(entries, latestReleased, releasedVersions);
  if (linkDefs) {
    parts.push("");
    parts.push(linkDefs);
  }
  const newText = parts.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";

  // Step 5: write.
  try {
    writeFileSync(CHANGELOG_PATH, newText, "utf-8");
  } catch (err) {
    fail(`could not write CHANGELOG.md: ${(err as Error).message}`);
    process.exit(1);
  }
  ok(`wrote ${CHANGELOG_PATH.replace(process.cwd() + "/", "")}`);

  // Step 6: move consumed entry files to consumed/.
  mkdirSync(CHANGELOG_CONSUMED_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  for (const e of entries) {
    const src = join(CHANGELOG_ENTRIES_DIR, e.file);
    const dst = join(CHANGELOG_CONSUMED_DIR, `${ts}-${e.file}`);
    try {
      renameSync(src, dst);
      ok(`consumed: ${e.file} → consumed/${ts}-${e.file}`);
    } catch (err) {
      warn(`could not move ${e.file} to consumed/: ${(err as Error).message}`);
    }
  }

  // Step 7: summary.
  const byType = new Map<ChangelogSection, number>();
  for (const e of entries) byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
  const summary = CHANGELOG_SECTIONS
    .filter((t) => byType.has(t))
    .map((t) => `${t}=${byType.get(t)}`)
    .join(", ");
  console.log("");
  console.log(`${C.green}${C.bold}✓ Assembled ${entries.length} entr${entries.length === 1 ? "y" : "ies"} into [Unreleased].${C.reset}`);
  console.log(`${C.dim}  ${summary}${C.reset}`);
  console.log(`${C.dim}  Next: bun run scripts/release/publish.ts${C.reset}`);
}

main();
