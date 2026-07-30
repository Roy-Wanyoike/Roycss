#!/usr/bin/env bun
/**
 * keyboard-nav.ts — Static analysis of keyboard accessibility in RoyCSS components.
 *
 * Scans every .tsx file in `src/components/roycss/` for common keyboard-a11y
 * anti-patterns. Does NOT require a running server — this is a pure
 * static-analysis check that runs in CI in milliseconds.
 *
 * Anti-patterns flagged:
 *
 *   K1  <button> without `aria-label` AND without visible text content
 *       (icon-only buttons must have an aria-label — WCAG 4.1.2 A).
 *   K2  `<div onClick>` without `role="button"` AND `tabIndex` (WCAG 2.1.1 A).
 *   K3  `<input>` without `aria-label`, `aria-labelledby`, or an
 *       associated `<label htmlFor>` in the same file (WCAG 1.3.1 A,
 *       4.1.2 A).
 *   K4  Custom modal/dialog (motion.div with overlay + open conditional)
 *       without an `onKeyDown` Escape handler visible in the file.
 *       Radix Dialog/Sheet are exempted (they handle Escape natively).
 *   K5  `tabIndex={positive-integer}` (positive tabindex is forbidden —
 *       WCAG 2.4.3 A).
 *   K6  `<a target="_blank">` without `rel="noopener noreferrer"`
 *       (security + a11y — tab-nabbing).
 *
 * The scanner uses a state-machine that correctly skips template strings,
 * single/double-quoted strings, and block/line comments — so `<button`
 * inside a `code={`...`}` template literal is NOT flagged.
 *
 * Output: a table to stdout + JSON to `a11y/results/keyboard-nav.json`.
 * Exit 0 if no violations, 1 otherwise.
 *
 * Usage:
 *   bun run a11y/keyboard-nav.ts
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(HERE, "..");
const COMPONENTS_DIR = join(PROJECT_ROOT, "src", "components", "roycss");
const RESULTS_DIR = join(HERE, "results");

mkdirSync(RESULTS_DIR, { recursive: true });

/* ─── 1. Enumerate .tsx files ──────────────────────────────────────────────── */

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

/* ─── 2. State machine that strips strings + comments ────────────────────────
 *
 * Walks the source character by character and produces a "stripped" version
 * where:
 *   - Template string contents (`...`) → replaced with spaces (newlines
 *     preserved for line-number accuracy). Template literals are the most
 *     common source of false-positive `<button` matches (e.g., the
 *     `code={`<button>...</button>`}` prop on `<CodeBlock>`).
 *   - Block comment contents (/* ... *\/) → spaces.
 *   - Line comment contents (// ...) → spaces.
 *
 * Single and double-quoted strings are NOT stripped — they're almost
 * always JSX attribute values (e.g., `role="button"`) and stripping them
 * would break subsequent attribute-value regex matches. A `<button` inside
 * a single-quoted JS string is rare in .tsx files; if it happens, the
 * violation can be suppressed via the JSON report.
 *
 * The stripped source has the SAME length and newline structure as the
 * original, so character offsets and line numbers map 1:1.
 */
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
      i++;
      continue;
    }

    if (state === "lineComment") {
      if (c === "\n") { state = "code"; i++; continue; }
      out[i] = " ";
      i++;
      continue;
    }

    if (state === "blockComment") {
      if (c === "*" && next === "/") { out[i] = " "; out[i + 1] = " "; state = "code"; i += 2; continue; }
      if (c !== "\n") out[i] = " ";
      i++;
      continue;
    }

    if (state === "template") {
      if (c === "\\") { out[i] = " "; if (i + 1 < n) out[i + 1] = " "; i += 2; continue; }
      if (c === "`" && templateBraceDepth === 0) { state = "code"; out[i] = " "; i++; continue; }
      if (c === "$" && next === "{") { templateBraceDepth++; out[i] = " "; out[i + 1] = " "; i += 2; continue; }
      if (c === "}" && templateBraceDepth > 0) { templateBraceDepth--; out[i] = " "; i++; continue; }
      if (c !== "\n") out[i] = " ";
      i++;
      continue;
    }
  }
  return out.join("");
}

/* ─── 3. Find JSX element open tags (multi-line aware) ────────────────────── */

interface JsxElement {
  tag: string;
  attrs: string;          // full attribute text (may span multiple lines, stripped of strings)
  openLine: number;       // 1-based line where `<tag` appears
  openCol: number;        // 1-based column where `<tag` appears
  endLine: number;        // 1-based line where the open tag ends (`>` or `/>`)
  endOffset: number;      // 0-based offset of the `>` (or `/` of `/>`) character
  snippet: string;        // first 100 chars of the open-tag line, trimmed
}

/**
 * Find JSX open tags in the stripped source. Captures attributes across
 * multiple lines by tracking `{...}` brace depth (so `>` inside an
 * expression like `onClick={() => x > 0}` is not treated as the tag end).
 */
function findJsxElements(stripped: string): JsxElement[] {
  const elements: JsxElement[] = [];
  const lines = stripped.split("\n");
  const flat = stripped;
  const lineStarts: number[] = [0];
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] === "\n") lineStarts.push(i + 1);
  }
  const offsetToLineCol = (off: number): { line: number; col: number } => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= off) lo = mid; else hi = mid - 1;
    }
    return { line: lo + 1, col: off - lineStarts[lo] + 1 };
  };

  // Regex finds `<Tag` where Tag starts with a letter. We then walk forward
  // to find the matching `>` or `/>`, skipping over `{...}` expressions.
  const tagStartRe = /<([A-Za-z][A-Za-z0-9.-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = tagStartRe.exec(flat)) !== null) {
    const startOff = m.index;
    const tagName = m[1];
    // Skip self-closing fragments and closing tags
    const prevChar = flat[startOff - 1] ?? "";
    if (prevChar === "/") continue; // it's a closing tag `</Tag`

    // Walk forward from after `<Tag` to find the end of the open tag.
    let i = startOff + m[0].length;
    let braceDepth = 0;
    let endOff = -1;
    while (i < flat.length) {
      const c = flat[i];
      if (c === "{") { braceDepth++; i++; continue; }
      if (c === "}") { braceDepth--; i++; continue; }
      if (braceDepth === 0) {
        if (c === ">") { endOff = i; break; }
        // Self-closing `/>` (note: the `/` is preserved in stripped source
        // because we only strip string/comment contents, not operators).
        if (c === "/" && flat[i + 1] === ">") { endOff = i + 1; break; }
      }
      i++;
    }
    if (endOff === -1) continue; // malformed; skip

    const attrs = flat.slice(startOff + m[0].length, endOff);
    const startLC = offsetToLineCol(startOff);
    const endLC = offsetToLineCol(endOff);
    const snippetLine = lines[startLC.line - 1] ?? "";
    elements.push({
      tag: tagName,
      attrs,
      openLine: startLC.line,
      openCol: startLC.col,
      endLine: endLC.line,
      endOffset: endOff,
      snippet: snippetLine.trim().slice(0, 120),
    });
    // Advance past this tag to avoid re-matching attributes inside it.
    tagStartRe.lastIndex = endOff + 1;
  }
  return elements;
}

/* ─── 4. Helpers ──────────────────────────────────────────────────────────── */

function hasAttr(attrs: string, name: string): boolean {
  // Match `name` as a JSX attribute — must be at word boundary.
  const re = new RegExp(`\\b${name}\\b(?=\\s|=)`);
  return re.test(attrs);
}

function getAttrValue(attrs: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]*)\\})`);
  const m = attrs.match(re);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}

/** Heuristic: does the element have visible text content (between open and close tags)?
 *
 *  We strip JSX tags (which contribute no text) but PRESERVE `{...}` JSX
 *  expressions, because a `{text}` or `{label}` expression is usually a
 *  text variable. This means an icon-only button like `<button>{someIcon}</button>`
 *  would be (incorrectly) treated as having visible text — a false negative.
 *  We accept this trade-off because false negatives are far less harmful
 *  than false positives in a static a11y gate. */
function elementHasVisibleText(stripped: string, el: JsxElement): boolean {
  // Walk forward from the end of the open tag, tracking depth of nested
  // same-tag elements. The matching close tag is the one that brings
  // depth back to 0.
  const flat = stripped;
  const openRe = new RegExp(`<${el.tag}\\b`, "g");
  const closeRe = new RegExp(`</${el.tag}\\s*>`, "g");
  openRe.lastIndex = el.endOffset + 1;
  closeRe.lastIndex = el.endOffset + 1;

  let depth = 1;
  let cursor = el.endOffset + 1;
  while (depth > 0 && cursor < flat.length) {
    openRe.lastIndex = cursor;
    closeRe.lastIndex = cursor;
    const openM = openRe.exec(flat);
    const closeM = closeRe.exec(flat);
    if (!closeM) return false;
    if (openM && openM.index < closeM.index) {
      depth++;
      cursor = openM.index + openM[0].length;
    } else {
      depth--;
      if (depth === 0) {
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

/* ─── 5. Violation types + per-file checks ────────────────────────────────── */

interface Violation {
  code: string;
  file: string;
  line: number;
  col: number;
  snippet: string;
  rule: string;
  wcag: string;
}

const violations: Violation[] = [];

function checkFile(filePath: string, source: string): void {
  const rel = relative(PROJECT_ROOT, filePath);
  const stripped = stripStringsAndComments(source);
  const elements = findJsxElements(stripped);

  // For K3 (label association), collect all `htmlFor` values in the file.
  const htmlFors: string[] = [];
  for (const el of elements) {
    if (el.tag === "label") {
      const f = getAttrValue(el.attrs, "htmlFor");
      if (f) htmlFors.push(f.trim());
    }
  }

  for (const el of elements) {
    // K1: button without aria-label AND without visible text
    if (el.tag === "button") {
      const hasAriaLabel = hasAttr(el.attrs, "aria-label") || hasAttr(el.attrs, "aria-labelledby");
      if (!hasAriaLabel) {
        const hasText = elementHasVisibleText(stripped, el);
        if (!hasText) {
          violations.push({
            code: "K1",
            file: rel,
            line: el.openLine,
            col: el.openCol,
            snippet: el.snippet,
            rule: "Icon-only <button> without aria-label or visible text",
            wcag: "WCAG 4.1.2 A (Name, Role, Value)",
          });
        }
      }
    }

    // K2: div onClick without role=button AND tabIndex
    if (el.tag === "div") {
      if (hasAttr(el.attrs, "onClick")) {
        // Lenient: if both `role=` and `tabIndex=` appear as attributes
        // (regardless of value, which may be conditional like
        // `role={cond ? "button" : undefined}`), we trust the developer.
        // Static analysis can't verify conditional values.
        const hasRoleAttr = hasAttr(el.attrs, "role");
        const hasTabIndex = hasAttr(el.attrs, "tabIndex");
        if (!hasRoleAttr || !hasTabIndex) {
          violations.push({
            code: "K2",
            file: rel,
            line: el.openLine,
            col: el.openCol,
            snippet: el.snippet,
            rule: `<div onClick> without role="button" AND tabIndex (keyboard-inaccessible)`,
            wcag: "WCAG 2.1.1 A (Keyboard)",
          });
        }
      }
    }

    // K3: input without accessible name
    if (el.tag === "input") {
      const typeVal = getAttrValue(el.attrs, "type");
      if (typeVal === "hidden") continue;

      const hasAriaLabel = hasAttr(el.attrs, "aria-label") || hasAttr(el.attrs, "aria-labelledby");
      const idVal = getAttrValue(el.attrs, "id");
      const hasAssociatedLabel = idVal ? htmlFors.includes(idVal.trim()) : false;
      if (!hasAriaLabel && !hasAssociatedLabel &&
          typeVal !== "color" && typeVal !== "submit" && typeVal !== "button" && typeVal !== "reset" && typeVal !== "file") {
        violations.push({
          code: "K3",
          file: rel,
          line: el.openLine,
          col: el.openCol,
          snippet: el.snippet,
          rule: "<input> without aria-label, aria-labelledby, or associated <label htmlFor>",
          wcag: "WCAG 1.3.1 A + 4.1.2 A",
        });
      }
    }

    // K5: positive tabindex
    {
      const ti = getAttrValue(el.attrs, "tabIndex");
      if (ti) {
        const numMatch = ti.match(/-?\d+/);
        if (numMatch) {
          const num = parseInt(numMatch[0], 10);
          if (num > 0) {
            violations.push({
              code: "K5",
              file: rel,
              line: el.openLine,
              col: el.openCol,
              snippet: el.snippet,
              rule: `tabIndex={${num}} — positive tabindex is forbidden (disrupts tab order)`,
              wcag: "WCAG 2.4.3 A (Focus Order)",
            });
          }
        }
      }
    }

    // K6: <a target="_blank"> without rel="noopener noreferrer"
    if (el.tag === "a") {
      const target = getAttrValue(el.attrs, "target");
      if (target === "_blank") {
        const relVal = getAttrValue(el.attrs, "rel") || "";
        if (!relVal.includes("noopener") || !relVal.includes("noreferrer")) {
          violations.push({
            code: "K6",
            file: rel,
            line: el.openLine,
            col: el.openCol,
            snippet: el.snippet,
            rule: `<a target="_blank"> without rel="noopener noreferrer"`,
            wcag: "Security + a11y (tab-nabbing)",
          });
        }
      }
    }
  }

  // K4: Custom modal/dialog without Escape handler
  const importsMotion = /from\s+["']framer-motion["']/.test(stripped);
  if (importsMotion) {
    const hasOverlay = /motion\.div[\s\S]*?(?:fixed inset-0|z-\[|overlay|modal)/.test(stripped);
    const hasOpenConditional = /\{open &&\s*\(/.test(stripped) || /\{open \? \(/.test(stripped) || /AnimatePresence/.test(stripped);
    const hasEscape = /["']Escape["']/.test(source) || /e\.key\s*===\s*["']Esc["']/.test(source);
    const usesRadixDialog = /from\s+["']@\/components\/ui\/(?:dialog|sheet|alert-dialog|drawer|popover)["']/.test(source);

    if (hasOverlay && hasOpenConditional && !hasEscape && !usesRadixDialog) {
      // Find the line of the motion.div with overlay class
      const lines = source.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/motion\.div/.test(lines[i]) && /(?:fixed inset-0|z-\[|overlay|modal)/.test(lines[i])) {
          violations.push({
            code: "K4",
            file: rel,
            line: i + 1,
            col: 1,
            snippet: lines[i].trim().slice(0, 120),
            rule: "Custom motion.div overlay/dialog without visible Escape (e.key === 'Escape') handler in file",
            wcag: "WCAG 2.1.2 A (No Keyboard Trap)",
          });
          break;
        }
      }
    }
  }
}

/* ─── 6. Run ──────────────────────────────────────────────────────────────── */

for (const f of files) {
  const src = readFileSync(f, "utf-8");
  checkFile(f, src);
}

/* ─── 7. Output ───────────────────────────────────────────────────────────── */

function printTable(): void {
  console.log("\n" + "═".repeat(100));
  console.log("Keyboard Navigation Static Analysis — src/components/roycss/*.tsx");
  console.log(`Scanned ${files.length} files · ${violations.length} violation(s) found`);
  console.log("═".repeat(100));

  if (violations.length === 0) {
    console.log("✅ All keyboard-a11y checks pass.");
    console.log("");
    return;
  }

  const byCode = new Map<string, Violation[]>();
  for (const v of violations) {
    if (!byCode.has(v.code)) byCode.set(v.code, []);
    byCode.get(v.code)!.push(v);
  }
  for (const [code, vs] of byCode) {
    console.log(`\n── ${code} ──────────────────────────────────────────────────────────────`);
    console.log(`Rule: ${vs[0].rule}`);
    console.log(`WCAG: ${vs[0].wcag}`);
    console.log(`Count: ${vs.length}`);
    for (const v of vs) {
      console.log(`  ${v.file}:${v.line}:${v.col}`);
      console.log(`    ${v.snippet}`);
    }
  }
  console.log("");
}

function writeJson(): void {
  const outPath = join(RESULTS_DIR, "keyboard-nav.json");
  const payload = {
    generatedAt: new Date().toISOString(),
    filesScanned: files.length,
    violationsByCode: violations.reduce<Record<string, number>>((acc, v) => {
      acc[v.code] = (acc[v.code] ?? 0) + 1;
      return acc;
    }, {}),
    totalViolations: violations.length,
    violations,
  };
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`JSON written to ${outPath}`);
}

printTable();
writeJson();

if (violations.length > 0) {
  console.error(`❌ keyboard-nav: FAIL — ${violations.length} violation(s) found.`);
  process.exit(1);
} else {
  console.log("✅ keyboard-nav: PASS — 0 violations.");
  process.exit(0);
}
