#!/usr/bin/env bun
/**
 * aria-coverage.ts — Compute ARIA coverage across all RoyCSS components.
 *
 * For each .tsx file in `src/components/roycss/`:
 *   - Count interactive elements: <button>, <a>, <input>, <select>,
 *     <textarea>, and any element with `role="button"`.
 *   - Count those WITH an accessible name: aria-label, aria-labelledby,
 *     visible text content (for buttons/links), or an associated
 *     <label htmlFor> in the same file (for inputs).
 *   - Compute coverage %.
 *
 * Output: per-file table + overall coverage. JSON to
 * `a11y/results/aria-coverage.json`.
 * Exit 0 if overall coverage ≥ 95%, 1 otherwise.
 *
 * Usage:
 *   bun run a11y/aria-coverage.ts
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(HERE, "..");
const COMPONENTS_DIR = join(PROJECT_ROOT, "src", "components", "roycss");
const RESULTS_DIR = join(HERE, "results");
mkdirSync(RESULTS_DIR, { recursive: true });

/* Reuse the same string/comment stripper + JSX finder as keyboard-nav.ts.
 * Inlined here to keep aria-coverage.ts self-contained. */

function stripStringsAndComments(src: string): string {
  const out = src.split("").map((c) => c);
  const n = src.length;
  let i = 0;
  let state: "code" | "template" | "blockComment" | "lineComment" = "code";
  let templateBraceDepth = 0;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1] ?? "";
    if (state === "code") {
      if (c === "/" && next === "/") { state = "lineComment"; out[i] = " "; out[i + 1] = " "; i += 2; continue; }
      if (c === "/" && next === "*") { state = "blockComment"; out[i] = " "; out[i + 1] = " "; i += 2; continue; }
      if (c === "`") { state = "template"; out[i] = " "; i++; continue; }
      i++; continue;
    }
    if (state === "lineComment") {
      if (c === "\n") { state = "code"; i++; continue; }
      out[i] = " "; i++; continue;
    }
    if (state === "blockComment") {
      if (c === "*" && next === "/") { out[i] = " "; out[i + 1] = " "; state = "code"; i += 2; continue; }
      if (c !== "\n") out[i] = " ";
      i++; continue;
    }
    if (state === "template") {
      if (c === "\\") { out[i] = " "; if (i + 1 < n) out[i + 1] = " "; i += 2; continue; }
      if (c === "`" && templateBraceDepth === 0) { state = "code"; out[i] = " "; i++; continue; }
      if (c === "$" && next === "{") { templateBraceDepth++; out[i] = " "; out[i + 1] = " "; i += 2; continue; }
      if (c === "}" && templateBraceDepth > 0) { templateBraceDepth--; out[i] = " "; i++; continue; }
      if (c !== "\n") out[i] = " ";
      i++; continue;
    }
  }
  return out.join("");
}

interface JsxElement {
  tag: string;
  attrs: string;
  openLine: number;
  endOffset: number;
}

function findJsxElements(stripped: string): JsxElement[] {
  const elements: JsxElement[] = [];
  const flat = stripped;
  const tagStartRe = /<([A-Za-z][A-Za-z0-9.-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = tagStartRe.exec(flat)) !== null) {
    const startOff = m.index;
    const tagName = m[1];
    const prevChar = flat[startOff - 1] ?? "";
    if (prevChar === "/") continue;
    let i = startOff + m[0].length;
    let braceDepth = 0;
    let endOff = -1;
    while (i < flat.length) {
      const c = flat[i];
      if (c === "{") { braceDepth++; i++; continue; }
      if (c === "}") { braceDepth--; i++; continue; }
      if (braceDepth === 0) {
        if (c === ">") { endOff = i; break; }
        if (c === "/" && flat[i + 1] === ">") { endOff = i + 1; break; }
      }
      i++;
    }
    if (endOff === -1) continue;
    const attrs = flat.slice(startOff + m[0].length, endOff);
    elements.push({ tag: tagName, attrs, openLine: startOff, endOffset: endOff });
    tagStartRe.lastIndex = endOff + 1;
  }
  return elements;
}

function hasAttr(attrs: string, name: string): boolean {
  const re = new RegExp(`\\b${name}\\b(?=\\s|=)`);
  return re.test(attrs);
}

function getAttrValue(attrs: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]*)\\})`);
  const mm = attrs.match(re);
  if (!mm) return null;
  return mm[1] ?? mm[2] ?? mm[3] ?? null;
}

function elementHasVisibleText(stripped: string, el: JsxElement): boolean {
  // Walk forward from the end of the open tag, tracking depth of nested
  // same-tag elements. The matching close tag is the one that brings
  // depth back to 0.
  const flat = stripped;
  const openRe = new RegExp(`<${el.tag}\\b`, "g");
  const closeRe = new RegExp(`</${el.tag}\\s*>`, "g");
  openRe.lastIndex = el.endOffset + 1;
  closeRe.lastIndex = el.endOffset + 1;

  // Find the offset of the matching close tag by interleaving open and
  // close tag matches.
  let depth = 1;
  let cursor = el.endOffset + 1;
  while (depth > 0 && cursor < flat.length) {
    openRe.lastIndex = cursor;
    closeRe.lastIndex = cursor;
    const openM = openRe.exec(flat);
    const closeM = closeRe.exec(flat);
    if (!closeM) return false; // no matching close — malformed
    if (openM && openM.index < closeM.index) {
      depth++;
      cursor = openM.index + openM[0].length;
    } else {
      depth--;
      if (depth === 0) {
        // closeM.index is the matching close tag.
        const inner = flat.slice(el.endOffset + 1, closeM.index);
        const textOnly = inner
          .replace(/<[A-Za-z][^>]*?(?:\/?)>/g, " ")
          .replace(/<\/[A-Za-z][^>]*>/g, " ")
          .trim();
        return /[A-Za-z0-9]/.test(textOnly);
      }
      cursor = closeM.index + closeM[0].length;
    }
  }
  return false;
}

/* ─── Enumerate files ─────────────────────────────────────────────────────── */

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listTsxFiles(full));
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const files = listTsxFiles(COMPONENTS_DIR).sort();

/* ─── Per-file analysis ───────────────────────────────────────────────────── */

interface FileCoverage {
  file: string;
  interactive: number;
  withName: number;
  coverage: number;        // 0-100
  missing: Array<{ line: number; tag: string; reason: string }>;
}

const coverages: FileCoverage[] = [];

for (const f of files) {
  const src = readFileSync(f, "utf-8");
  const stripped = stripStringsAndComments(src);
  const elements = findJsxElements(stripped);

  // Collect all htmlFor values in the file (for input label association).
  const htmlFors: string[] = [];
  for (const el of elements) {
    if (el.tag === "label") {
      const fVal = getAttrValue(el.attrs, "htmlFor");
      if (fVal) htmlFors.push(fVal.trim());
    }
  }

  let interactive = 0;
  let withName = 0;
  const missing: Array<{ line: number; tag: string; reason: string }> = [];

  for (const el of elements) {
    const isInteractive =
      el.tag === "button" ||
      el.tag === "a" ||
      el.tag === "input" ||
      el.tag === "select" ||
      el.tag === "textarea" ||
      hasAttr(el.attrs, "role"); // role="button" etc.

    if (!isInteractive) continue;
    // Skip inputs that are inherently non-interactive.
    if (el.tag === "input") {
      const typeVal = getAttrValue(el.attrs, "type");
      if (typeVal === "hidden") continue;
    }

    interactive++;
    const lineNum = stripped.slice(0, el.openLine).split("\n").length;

    // Determine if the element has an accessible name.
    let hasName = false;
    let reason = "";

    if (hasAttr(el.attrs, "aria-label") || hasAttr(el.attrs, "aria-labelledby")) {
      hasName = true;
    } else if (el.tag === "input" || el.tag === "select" || el.tag === "textarea") {
      // For form fields, check for associated <label htmlFor>.
      const idVal = getAttrValue(el.attrs, "id");
      if (idVal && htmlFors.includes(idVal.trim())) {
        hasName = true;
      } else if (el.tag === "input") {
        const typeVal = getAttrValue(el.attrs, "type");
        // Native color/submission inputs have implicit names.
        if (typeVal === "color" || typeVal === "submit" || typeVal === "button" || typeVal === "reset" || typeVal === "file") {
          hasName = true;
        } else {
          reason = `<input> without aria-label, aria-labelledby, or associated <label htmlFor>`;
        }
      } else {
        reason = `<${el.tag}> without aria-label, aria-labelledby, or associated <label htmlFor>`;
      }
    } else if (el.tag === "button" || el.tag === "a") {
      // For buttons and links, check for visible text content.
      if (elementHasVisibleText(stripped, el)) {
        hasName = true;
      } else {
        reason = `<${el.tag}> without aria-label or visible text content`;
      }
    } else if (hasAttr(el.attrs, "role")) {
      // role="button" on a div/span — needs aria-label or text content.
      if (elementHasVisibleText(stripped, el)) {
        hasName = true;
      } else if (hasAttr(el.attrs, "aria-label") || hasAttr(el.attrs, "aria-labelledby")) {
        hasName = true;
      } else {
        reason = `element with role attribute but no aria-label or text content`;
      }
    }

    if (hasName) {
      withName++;
    } else {
      missing.push({ line: lineNum, tag: el.tag, reason });
    }
  }

  const coverage = interactive === 0 ? 100 : Math.round((withName / interactive) * 100);
  coverages.push({
    file: relative(PROJECT_ROOT, f),
    interactive,
    withName,
    coverage,
    missing,
  });
}

/* ─── Output ──────────────────────────────────────────────────────────────── */

function printTable(): void {
  console.log("\n" + "═".repeat(95));
  console.log("ARIA Coverage — src/components/roycss/*.tsx");
  console.log("═".repeat(95));
  console.log("File".padEnd(50) + " | Interactive | With name | Coverage | Missing");
  console.log("-".repeat(95));
  for (const c of coverages) {
    const file = c.file.length > 48 ? c.file.slice(-48) : c.file.padEnd(48);
    const interactive = String(c.interactive).padStart(11);
    const withName = String(c.withName).padStart(9);
    const coverage = (c.coverage + "%").padStart(8);
    const missing = String(c.missing.length).padStart(7);
    console.log(`${file} | ${interactive} | ${withName} | ${coverage} | ${missing}`);
  }
  console.log("-".repeat(95));

  const totalInteractive = coverages.reduce((s, c) => s + c.interactive, 0);
  const totalWithName = coverages.reduce((s, c) => s + c.withName, 0);
  const overallCoverage = totalInteractive === 0 ? 100 : Math.round((totalWithName / totalInteractive) * 100);
  console.log(
    `${"OVERALL".padEnd(48)} | ${String(totalInteractive).padStart(11)} | ${String(totalWithName).padStart(9)} | ${(overallCoverage + "%").padStart(8)} |`,
  );
  console.log("");

  // Print details for files with < 100% coverage.
  const imperfect = coverages.filter((c) => c.coverage < 100);
  if (imperfect.length > 0) {
    console.log("Files with < 100% coverage:");
    for (const c of imperfect) {
      console.log(`  ${c.file} (${c.coverage}% — ${c.missing.length} missing)`);
      for (const m of c.missing) {
        console.log(`    line ${m.line}: <${m.tag}> — ${m.reason}`);
      }
    }
    console.log("");
  }
}

function writeJson(): void {
  const outPath = join(RESULTS_DIR, "aria-coverage.json");
  const totalInteractive = coverages.reduce((s, c) => s + c.interactive, 0);
  const totalWithName = coverages.reduce((s, c) => s + c.withName, 0);
  const overallCoverage = totalInteractive === 0 ? 100 : Math.round((totalWithName / totalInteractive) * 100);
  const payload = {
    generatedAt: new Date().toISOString(),
    spec: "WCAG 4.1.2 A (Name, Role, Value)",
    files: coverages,
    summary: {
      filesScanned: coverages.length,
      totalInteractive,
      totalWithName,
      overallCoverage,
    },
  };
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`JSON written to ${outPath}`);
}

printTable();
writeJson();

const totalInteractive = coverages.reduce((s, c) => s + c.interactive, 0);
const totalWithName = coverages.reduce((s, c) => s + c.withName, 0);
const overallCoverage = totalInteractive === 0 ? 100 : Math.round((totalWithName / totalInteractive) * 100);

if (overallCoverage >= 95) {
  console.log(`✅ aria-coverage: PASS — overall coverage ${overallCoverage}% (≥ 95% threshold).`);
  process.exit(0);
} else {
  console.error(`❌ aria-coverage: FAIL — overall coverage ${overallCoverage}% (< 95% threshold).`);
  process.exit(1);
}
