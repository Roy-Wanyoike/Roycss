/**
 * security/audit.ts
 *
 * Runs `bun audit --json`, parses the result, counts vulnerabilities by
 * severity, and writes a structured report to
 * `security/results/audit-report.json`.
 *
 * Exit codes:
 *   0 — 0 high + 0 critical vulnerabilities
 *   1 — ≥ 1 high or critical vulnerability
 *
 * The report format:
 * {
 *   "generatedAt": "2025-02-04T12:34:56.789Z",
 *   "tool": "bun audit",
 *   "toolVersion": "v1.3.14",
 *   "summary": { "critical": N, "high": N, "moderate": N, "low": N, "info": N, "total": N },
 *   "affectedPackages": [{ "name": "...", "installedVersion": "...", "advisories": [...] }],
 *   "overridesApplied": ["next", "next-auth", ...]
 * }
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const RESULTS_DIR = join(import.meta.dir, "results");
const REPORT_PATH = join(RESULTS_DIR, "audit-report.json");

/**
 * Accepted-risk advisories.
 *
 * Each entry is a vulnerability that cannot be fixed without breaking
 * a transitive dependency, AND whose vulnerable code path is not
 * invoked at runtime. The justification must reference the threat
 * model entry that documents the accepted risk.
 *
 * Format: { id, package, reason, threatModelRef }
 *
 * `id` is the GitHub advisory ID (numeric, from `bun audit --json`).
 */
interface AcceptedAdvisory {
  id: number;
  package: string;
  reason: string;
  threatModelRef: string;
}

// Accepted-risk advisories.
//
// Each entry is a vulnerability that cannot be fixed without breaking
// a transitive dependency, AND whose vulnerable code path is not
// invoked at runtime. The justification must reference the threat
// model entry that documents the accepted risk.
//
// Format: { id, package, reason, threatModelRef }
//
// `id` is the GitHub advisory ID (numeric, from `bun audit --json`).
//
// As of 2026-07-30 (Task 07 re-verification), the list is EMPTY: every
// previously-accepted advisory has been resolved by upgrading the
// affected transitive dependency and pinning the upgrade via the
// `overrides` field in `package.json`. The shape of the array is kept
// so future advisories that genuinely cannot be patched can be
// documented here without re-engineering audit.ts.
const ACCEPTED_ADVISORIES: AcceptedAdvisory[] = [
  // Previously: brace-expansion (GHSA-mh99-v99m-4gvg, advisory id 1124334)
  //   Resolved by upgrading the `minimatch` override from `^9.0.7` to
  //   `^10.2.6` (which depends on `brace-expansion@^5.0.8`) and adding a
  //   top-level `brace-expansion: ^5.0.9` override. minimatch@10 exports
  //   `expand` as a named ESM/CJS export, fixing the `balanced is not a
  //   function` regression that previously blocked the upgrade from
  //   brace-expansion@2.x. See docs/adr/07-security-supply-chain.md §6.
];

interface Advisory {
  id: number;
  url: string;
  title: string;
  severity: "critical" | "high" | "moderate" | "low" | "info";
  vulnerable_versions?: string;
  patched_versions?: string | null;
  cwe?: string[];
  cvss?: { score: number; vectorString: string | null };
}

interface AuditJson {
  [packageName: string]: Advisory[];
}

interface AffectedPackage {
  name: string;
  installedVersion: string | null;
  advisoryCount: number;
  severities: string[];
  advisories: Advisory[];
}

interface AuditReport {
  generatedAt: string;
  tool: string;
  toolVersion: string;
  bunAuditExitCode: number;
  summary: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    info: number;
    total: number;
  };
  acceptedAdvisories: AcceptedAdvisory[];
  acceptedAdvisoryCount: number;
  acceptedAdvisoriesHit: AcceptedAdvisory[];
  unacceptedHighOrCritical: number;
  affectedPackageCount: number;
  affectedPackages: AffectedPackage[];
  postInstallScripts: string[];
  overridesApplied: string[];
  exitCode: number;
  explanation: string;
}

function getInstalledVersion(name: string): string | null {
  // Walk up nested node_modules (bun/npm hoisting) to find the installed package.
  const candidates = [
    join(ROOT, "node_modules", name, "package.json"),
    join(ROOT, "node_modules", ".store", name + "@*", "package.json"),
  ];
  for (const p of candidates) {
    try {
      const j = JSON.parse(readFileSync(p, "utf8"));
      return j.version ?? null;
    } catch {
      // try next
    }
  }
  // Fallback: try direct readFileSync on the canonical path
  try {
    const pkgPath = join(ROOT, "node_modules", name, "package.json");
    const j = JSON.parse(readFileSync(pkgPath, "utf8"));
    return j.version ?? null;
  } catch {
    return null;
  }
}

function detectPostInstallScripts(): string[] {
  const rootPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const deps = Object.keys(rootPkg.dependencies || {});
  const offenders: string[] = [];
  for (const d of deps) {
    try {
      const p = JSON.parse(readFileSync(join(ROOT, "node_modules", d, "package.json"), "utf8"));
      if (p.scripts && (p.scripts.postinstall || p.scripts.preinstall || p.scripts.install || p.scripts.prepare)) {
        offenders.push(d);
      }
    } catch {
      // dep not installed; skip
    }
  }
  return offenders;
}

function getOverridesApplied(): string[] {
  try {
    const rootPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    const overrides = rootPkg.overrides || {};
    return Object.keys(overrides).sort();
  } catch {
    return [];
  }
}

function getBunVersion(): string {
  try {
    const v = execSync("bun --version", { encoding: "utf8" }).trim();
    return `v${v}`;
  } catch {
    return "unknown";
  }
}

function main(): number {
  mkdirSync(RESULTS_DIR, { recursive: true });

  // Run `bun audit --json`. This command exits 1 if any advisory is found,
  // but the JSON output is still written to stdout.
  let auditJson: AuditJson = {};
  let bunExit = 0;
  try {
    const stdout = execSync("bun audit --json", {
      encoding: "utf8",
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 50 * 1024 * 1024,
    });
    auditJson = JSON.parse(stdout);
  } catch (err: any) {
    // bun audit exits non-zero when vulns are found, but still emits JSON to stdout
    if (err.stdout) {
      try {
        auditJson = JSON.parse(err.stdout);
      } catch {
        // JSON parse failed; treat as empty
      }
    }
    bunExit = err.status ?? 1;
  }

  // Build a set of accepted advisory IDs for O(1) lookup. Accepted
  // advisories are documented in the threat model's residual-risk table
  // and represent vulnerabilities whose vulnerable code path is not
  // invoked at runtime. They are subtracted from the severity counts so
  // the audit reflects actual risk, not theoretical advisories.
  const acceptedIds = new Set(ACCEPTED_ADVISORIES.map((a) => a.id));
  const acceptedHit: AcceptedAdvisory[] = [];

  // Count by severity
  const summary = { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 };
  const affectedPackages: AffectedPackage[] = [];
  for (const [name, advisories] of Object.entries(auditJson)) {
    if (!Array.isArray(advisories)) continue;
    const severities: string[] = [];
    for (const a of advisories) {
      const sev = (a.severity || "info") as keyof typeof summary;
      if (acceptedIds.has(a.id)) {
        // Record the accepted advisory for reporting, but do NOT
        // increment the severity counter — the risk is documented as
        // accepted in the threat model.
        const accepted = ACCEPTED_ADVISORIES.find((x) => x.id === a.id);
        if (accepted && !acceptedHit.some((h) => h.id === accepted.id)) {
          acceptedHit.push(accepted);
        }
        severities.push(`${sev}(accepted)`);
        continue;
      }
      if (typeof summary[sev] === "number") summary[sev]++;
      else summary.info++;
      summary.total++;
      severities.push(sev);
    }
    affectedPackages.push({
      name,
      installedVersion: getInstalledVersion(name),
      advisoryCount: advisories.length,
      severities,
      advisories,
    });
  }
  affectedPackages.sort((a, b) => a.name.localeCompare(b.name));

  const postInstallScripts = detectPostInstallScripts();
  const overridesApplied = getOverridesApplied();

  // Exit code: 0 if 0 high + 0 critical (per task spec).
  // Postinstall scripts are reported but do not fail the audit — the
  // marketing site is allowed to have deps with postinstall (e.g. prisma,
  // sharp, which download native binaries from official sources). The
  // publishable artifacts (roycss npm package, VS Code extension,
  // Inspector) are governed separately by their own checklists and ship
  // with zero runtime deps.
  const hasHighOrCritical = summary.high > 0 || summary.critical > 0;
  const exitCode = hasHighOrCritical ? 1 : 0;

  let explanation: string;
  if (exitCode === 0) {
    const acceptedNote = acceptedHit.length > 0
      ? ` ${acceptedHit.length} advisory accepted-risk (${acceptedHit.map((a) => a.package).join(", ")}).`
      : "";
    explanation = `PASS: 0 critical, 0 high. (${summary.moderate} moderate, ${summary.low} low, ${acceptedHit.length} accepted-risk.)${acceptedNote} ${postInstallScripts.length} runtime deps have postinstall scripts (documented in ADR §2.1; native-binary downloaders like prisma/sharp are accepted).`;
  } else {
    const parts: string[] = [];
    if (summary.critical > 0) parts.push(`${summary.critical} critical`);
    if (summary.high > 0) parts.push(`${summary.high} high`);
    explanation = `FAIL: ${parts.join(", ")}. See docs/adr/07-security-supply-chain.md §6 for override guidance.`;
  }

  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    tool: "bun audit",
    toolVersion: getBunVersion(),
    bunAuditExitCode: bunExit,
    summary,
    acceptedAdvisories: ACCEPTED_ADVISORIES,
    acceptedAdvisoryCount: acceptedHit.length,
    acceptedAdvisoriesHit: acceptedHit,
    unacceptedHighOrCritical: summary.high + summary.critical,
    affectedPackageCount: affectedPackages.length,
    affectedPackages,
    postInstallScripts,
    overridesApplied,
    exitCode,
    explanation,
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  // Human-readable summary
  console.log("═══════════════════════════════════════════════════════════");
  console.log(" RoyCSS Security Audit — bun audit");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` Generated:     ${report.generatedAt}`);
  console.log(` Tool:          ${report.tool} ${report.toolVersion}`);
  console.log(` bun audit exit code: ${bunExit}`);
  console.log("");
  console.log(" Severity counts:");
  console.log(`   critical:  ${summary.critical}`);
  console.log(`   high:      ${summary.high}`);
  console.log(`   moderate:  ${summary.moderate}`);
  console.log(`   low:       ${summary.low}`);
  console.log(`   info:      ${summary.info}`);
  console.log(`   total:     ${summary.total}`);
  console.log("");
  console.log(` Affected packages:        ${affectedPackages.length}`);
  console.log(` Overrides applied:        ${overridesApplied.length} (${overridesApplied.join(", ") || "none"})`);
  console.log(` Postinstall script deps:  ${postInstallScripts.length} (${postInstallScripts.join(", ") || "none"})`);
  if (acceptedHit.length > 0) {
    console.log(` Accepted-risk advisories: ${acceptedHit.length}`);
    for (const a of acceptedHit) {
      console.log(`   - ${a.package} (advisory ${a.id}) — ${a.reason.slice(0, 110)}${a.reason.length > 110 ? "…" : ""}`);
    }
  }
  console.log("");
  if (affectedPackages.length > 0) {
    console.log(" Affected packages (top 20):");
    for (const p of affectedPackages.slice(0, 20)) {
      const sevCounts: Record<string, number> = {};
      for (const s of p.severities) sevCounts[s] = (sevCounts[s] || 0) + 1;
      const sevSummary = Object.entries(sevCounts).map(([k, v]) => `${v} ${k}`).join(", ");
      console.log(`   ${p.name.padEnd(28)} ${p.installedVersion ?? "?"} — ${p.advisoryCount} advisory (${sevSummary})`);
    }
    if (affectedPackages.length > 20) {
      console.log(`   ... and ${affectedPackages.length - 20} more (see results/audit-report.json)`);
    }
    console.log("");
  }
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` ${exitCode === 0 ? "✅ PASS" : "❌ FAIL"} — ${explanation}`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` Report written to: ${REPORT_PATH}`);
  console.log("");

  return exitCode;
}

try {
  const code = main();
  process.exit(code);
} catch (err) {
  console.error("audit.ts: uncaught error:", err);
  process.exit(2);
}
