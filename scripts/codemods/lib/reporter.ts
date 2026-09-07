/**
 * reporter.ts — shared codemod core (PF-015, issue #95)
 *
 * Uniform reporting for every codemod (CLI + library API): per-file lines
 * and a run summary covering files, classes replaced, unknown classes, kept
 * (no-equivalent) classes and classes that were already RoyCSS.
 */

import type { Replacement } from "./mapper";

export interface FileReport {
  /** Path as passed by the caller (relative to cwd). */
  file: string;
  /** True when the transform produced different output. */
  changed: boolean;
  replaced: Replacement[];
  unknown: string[];
  kept: string[];
  ignored: string[];
  alreadyRoycss: string[];
  /** Source classes whose mapping is approximate (outbound codemods). */
  approximate: string[];
  /** Extra artifact emitted by the transform (to-vanilla-css CSS block). */
  css?: string;
}

export interface Summary {
  codemod: string;
  files: number;
  filesChanged: number;
  classesReplaced: number;
  unknownClasses: string[];
  keptClasses: string[];
  ignoredClasses: string[];
  alreadyRoycssClasses: string[];
  approximateClasses: string[];
  wrote: boolean;
}

export function summarize(codemodId: string, reports: FileReport[], wrote: boolean): Summary {
  const unknown = new Set<string>();
  const kept = new Set<string>();
  const ignored = new Set<string>();
  const already = new Set<string>();
  const approximate = new Set<string>();
  let filesChanged = 0;
  let classesReplaced = 0;
  for (const r of reports) {
    if (r.changed) filesChanged++;
    classesReplaced += r.replaced.length;
    r.unknown.forEach((c) => unknown.add(c));
    r.kept.forEach((c) => kept.add(c));
    r.ignored.forEach((c) => ignored.add(c));
    r.alreadyRoycss.forEach((c) => already.add(c));
    r.approximate.forEach((c) => approximate.add(c));
  }
  return {
    codemod: codemodId,
    files: reports.length,
    filesChanged,
    classesReplaced,
    unknownClasses: [...unknown],
    keptClasses: [...kept],
    ignoredClasses: [...ignored],
    alreadyRoycssClasses: [...already],
    approximateClasses: [...approximate],
    wrote,
  };
}

function joinList(classes: string[], max = 12): string {
  const shown = classes.slice(0, max).join(", ");
  const extra = classes.length - Math.min(classes.length, max);
  return extra > 0 ? `${shown}, … +${extra} more` : shown;
}

/**
 * One-line (plus optional detail lines) report for a single file.
 * Format is identical for the CLI and the library API.
 */
export function formatFileReport(report: FileReport, detail = false): string {
  const status = report.changed ? "changed" : "unchanged";
  const parts = [
    `${report.replaced.length} replaced`,
    `${report.kept.length} kept (no equivalent)`,
    `${report.ignored.length} kept as-is`,
    `${report.unknown.length} unknown`,
    `${report.alreadyRoycss.length} already roycss`,
  ];
  const head = `${report.file} — ${status}: ${parts.join(", ")}`;
  if (!detail) return head;
  const lines = [head];
  for (const r of report.replaced) lines.push(`  ✓ ${r.from} → ${r.to}`);
  for (const cls of report.approximate) lines.push(`  ~ ${cls} → approximate mapping (review)`);
  for (const cls of report.kept) lines.push(`  = ${cls} kept — no RoyCSS equivalent`);
  for (const cls of report.unknown) lines.push(`  ? ${cls} unknown — left untouched`);
  return lines.join("\n");
}

/** Multi-line summary of a full codemod run. */
export function formatSummary(summary: Summary): string {
  const lines = [
    `migrate ${summary.codemod}: ${summary.files} file${summary.files === 1 ? "" : "s"} scanned, ${summary.filesChanged} changed`,
    `  classes replaced:      ${summary.classesReplaced}`,
    `  kept (no equivalent):  ${summary.keptClasses.length}${summary.keptClasses.length ? ` — ${joinList(summary.keptClasses)}` : ""}`,
    `  kept as-is:            ${summary.ignoredClasses.length}${summary.ignoredClasses.length ? ` — ${joinList(summary.ignoredClasses)}` : ""}`,
    `  unknown:               ${summary.unknownClasses.length}${summary.unknownClasses.length ? ` — ${joinList(summary.unknownClasses)}` : ""}`,
    `  already roycss:        ${summary.alreadyRoycssClasses.length}${summary.alreadyRoycssClasses.length ? ` — ${joinList(summary.alreadyRoycssClasses)}` : ""}`,
  ];
  if (summary.approximateClasses.length) {
    lines.push(`  approximate (review):  ${summary.approximateClasses.length} — ${joinList(summary.approximateClasses)}`);
  }
  lines.push(summary.wrote ? "  mode: applied (--write)" : "  mode: dry-run (use --write to apply)");
  return lines.join("\n");
}
