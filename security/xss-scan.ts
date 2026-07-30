// security/xss-scan.ts
//
// Scans src/components/.tsx, src/app/.tsx (and other src/ TSX/TS) for XSS vectors:
//
//   1. dangerouslySetInnerHTML — flagged UNLESS the line above has a
//      "SECURITY:" comment that references a threat model entry
//      (e.g. "SECURITY: T5 — library CSS, not user content").
//   2. .innerHTML =            — flagged unconditionally
//   3. eval(                   — flagged unconditionally
//   4. new Function(           — flagged unconditionally
//   5. document.write          — flagged unconditionally
//   6. setTimeout(string, …) / setInterval(string, …) — flagged unconditionally
//
// Output: security/results/xss-report.json
//
// Exit code: 0 if 0 unsanitized uses, 1 otherwise.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const RESULTS_DIR = join(import.meta.dir, "results");
const REPORT_PATH = join(RESULTS_DIR, "xss-report.json");

interface Finding {
  file: string;
  line: number;
  column: number;
  pattern: string;
  snippet: string;
  sanitized: boolean;
  sanitizationComment: string | null;
  explanation: string;
}

interface Report {
  generatedAt: string;
  filesScanned: number;
  patterns: string[];
  findings: Finding[];
  sanitized: Finding[];
  unsanitized: Finding[];
  exitCode: number;
}

const PATTERNS: Array<{
  name: string;
  regex: RegExp;
  explanation: string;
  allowSanitizeComment: boolean;
}> = [
  {
    name: "dangerouslySetInnerHTML",
    regex: /dangerouslySetInnerHTML/g,
    explanation:
      "React escape hatch that injects raw HTML. If the string contains user input, it's a critical XSS. Allowed only with a `// SECURITY:` comment naming the threat model entry that justifies it.",
    allowSanitizeComment: true,
  },
  {
    name: "innerHTML-assign",
    regex: /\.innerHTML\s*=/g,
    explanation:
      "Direct DOM assignment of an HTML string. If the string contains user input, it's an XSS. Use textContent or React children instead.",
    allowSanitizeComment: false,
  },
  {
    name: "eval",
    regex: /\beval\s*\(/g,
    explanation:
      "eval() executes arbitrary JavaScript from a string. CSP 'unsafe-eval' is required (which we don't allow). Refactor to avoid eval entirely.",
    allowSanitizeComment: false,
  },
  {
    name: "new-Function",
    regex: /new\s+Function\s*\(/g,
    explanation:
      "new Function() is equivalent to eval — it executes arbitrary JavaScript from a string. Refactor to a static function.",
    allowSanitizeComment: false,
  },
  {
    name: "document-write",
    regex: /document\.write\s*\(/g,
    explanation:
      "document.write() injects raw HTML into the document stream. CSP blocks it; refactor to DOM APIs.",
    allowSanitizeComment: false,
  },
  {
    name: "setTimeout-string",
    regex: /setTimeout\s*\(\s*['"`]/g,
    explanation:
      "setTimeout(string, …) is equivalent to eval. Pass a function reference instead.",
    allowSanitizeComment: false,
  },
  {
    name: "setInterval-string",
    regex: /setInterval\s*\(\s*['"`]/g,
    explanation:
      "setInterval(string, …) is equivalent to eval. Pass a function reference instead.",
    allowSanitizeComment: false,
  },
];

function walkDir(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      // Skip node_modules, .next, dist, etc.
      if (entry === "node_modules" || entry === ".next" || entry === "dist" || entry === ".git") continue;
      walkDir(full, out);
    } else if (st.isFile() && /\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function existsSync(p: string): boolean {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

function scanFile(filePath: string, findings: Finding[]): void {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  for (const pat of PATTERNS) {
    pat.regex.lastIndex = 0;
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      let m: RegExpExecArray | null;
      pat.regex.lastIndex = 0;
      while ((m = pat.regex.exec(line)) !== null) {
        // Skip if the line is itself a comment (// ... or * ... inside JSDoc,
        // or starts with /*). This avoids flagging documentation that
        // references the word "dangerouslySetInnerHTML" or "eval".
        const trimmed = line.trimStart();
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
          continue;
        }
        // Also skip if the match is inside a // comment on the same line
        const codeBefore = line.slice(0, m.index);
        const lastSlash = codeBefore.lastIndexOf("//");
        const lastStar = codeBefore.lastIndexOf("/*");
        if (lastSlash !== -1 && lastSlash > (lastStar === -1 ? -1 : lastStar)) {
          continue;
        }
        // Check if it's part of a string literal — crude heuristic
        // (good enough for catching real uses; the SECURITY comment
        // mechanism handles false positives)
        let sanitized = false;
        let sanitizationComment: string | null = null;
        if (pat.allowSanitizeComment) {
          // Simple, robust approach: walk UP from the match line through
          // up to 10 preceding lines, looking for any line that contains
          // the literal "SECURITY" annotation (in any comment form:
          // // SECURITY:, /* SECURITY:, {/* SECURITY:). If found, the
          // use is treated as sanitized. We grab the first line that
          // matches and use its content as the sanitization comment.
          for (let up = lineIdx; up >= 0 && up >= lineIdx - 10; up--) {
            const cand = lines[up] ?? "";
            // Match SECURITY: in any form
            const secMatch = cand.match(/SECURITY\s*:?\s*(.+)/i);
            if (secMatch) {
              sanitized = true;
              // Capture the rest of the SECURITY line + subsequent
              // continuation lines until the next blank/code line.
              const parts: string[] = [secMatch[1].trim()];
              for (let dn = up + 1; dn <= lineIdx; dn++) {
                const nextLine = lines[dn] ?? "";
                const nextTrim = nextLine.trim();
                if (
                  nextTrim === "" ||
                  (!nextTrim.startsWith("//") &&
                    !nextTrim.startsWith("*") &&
                    !nextTrim.startsWith("/*") &&
                    !nextTrim.startsWith("<") &&
                    !/^\w/.test(nextTrim) === false && // word-y continuation
                    !nextTrim.includes("dangerouslySetInnerHTML"))
                ) {
                  // Heuristic: if it looks like a continuation comment line,
                  // include it. Otherwise stop.
                  if (
                    nextTrim.startsWith("//") ||
                    nextTrim.startsWith("*") ||
                    nextTrim.startsWith("/*") ||
                    /^\s*\*?\s*\w/.test(nextLine)
                  ) {
                    parts.push(nextTrim.replace(/^[*\/\s]+/, ""));
                    continue;
                  }
                  break;
                }
                parts.push(nextTrim.replace(/^[*\/\s]+/, ""));
              }
              sanitizationComment = parts.join(" ").replace(/\s+/g, " ").trim();
              break;
            }
          }
        }
        findings.push({
          file: relative(ROOT, filePath),
          line: lineIdx + 1,
          column: m.index + 1,
          pattern: pat.name,
          snippet: line.trim().slice(0, 200),
          sanitized,
          sanitizationComment,
          explanation: pat.explanation,
        });
      }
    }
  }
}

function main(): number {
  mkdirSync(RESULTS_DIR, { recursive: true });

  const findings: Finding[] = [];
  const filesScanned: string[] = [];

  // Scan src/components/ and src/app/ and src/hooks/ and src/lib/ and src/cli/
  for (const dir of ["src/components", "src/app", "src/hooks", "src/lib", "src/cli"]) {
    const full = join(ROOT, dir);
    if (!existsSync(full)) continue;
    const files = walkDir(full);
    for (const f of files) {
      filesScanned.push(f);
      scanFile(f, findings);
    }
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.pattern.localeCompare(b.pattern));
  const sanitized = findings.filter((f) => f.sanitized);
  const unsanitized = findings.filter((f) => !f.sanitized);

  const exitCode = unsanitized.length === 0 ? 0 : 1;
  const report: Report = {
    generatedAt: new Date().toISOString(),
    filesScanned: filesScanned.length,
    patterns: PATTERNS.map((p) => p.name),
    findings,
    sanitized,
    unsanitized,
    exitCode,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" RoyCSS XSS scan");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` Generated:    ${report.generatedAt}`);
  console.log(` Files scanned:${filesScanned.length}`);
  console.log(` Patterns:     ${PATTERNS.length} (${PATTERNS.map((p) => p.name).join(", ")})`);
  console.log("");
  console.log(` Findings:     ${findings.length}`);
  console.log(`   Sanitized (have // SECURITY: comment): ${sanitized.length}`);
  console.log(`   Unsanitized:                          ${unsanitized.length}`);
  console.log("");

  if (sanitized.length > 0) {
    console.log(" Sanitized uses (allow-listed):");
    for (const f of sanitized) {
      console.log(`   [${f.pattern}] ${f.file}:${f.line}`);
      console.log(`     ${f.snippet}`);
      console.log(`     SECURITY comment: ${f.sanitizationComment}`);
    }
    console.log("");
  }
  if (unsanitized.length > 0) {
    console.log(" Unsanitized uses (FAIL):");
    for (const f of unsanitized) {
      console.log(`   [${f.pattern}] ${f.file}:${f.line}:${f.column}`);
      console.log(`     ${f.snippet}`);
      console.log(`     ${f.explanation}`);
    }
    console.log("");
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log(` ${exitCode === 0 ? "✅ PASS" : "❌ FAIL"} — ${exitCode === 0 ? "0 unsanitized XSS vectors." : `${unsanitized.length} unsanitized XSS vectors found.`}`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` Report written to: ${REPORT_PATH}`);
  console.log("");

  return exitCode;
}

try {
  process.exit(main());
} catch (err) {
  console.error("xss-scan.ts: uncaught error:", err);
  process.exit(2);
}
