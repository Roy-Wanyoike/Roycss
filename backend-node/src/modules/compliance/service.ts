/**
 * Compliance service — Prisma-backed Roy Compliance standards + scan results.
 *
 * Persisted via the `ComplianceStandard` + `ComplianceScan` Prisma models.
 * Seeds 5 accessibility standards (WCAG 2.2 AA, WCAG 2.2 AAA, ADA,
 * Section 508, EN 301 549) plus 3 sample scan results. Compliance
 * reports remain a static in-memory seed (no Prisma model).
 *
 * Field-mapping: the Prisma `ComplianceStandard` model exposes (slug,
 * name, description, framework). The domain shape's `id ← slug`,
 * `name`, `description` map directly; `framework ← code` (e.g.
 * "WCAG2.2-AA"); the extra fields (level, criteriaCount, region) are
 * JSON-encoded inside `description` as a wrapper. The Prisma
 * `ComplianceScan` model exposes (standardId, url, status,
 * violationsJson). The domain shape's extra fields (standardName,
 * scannedAt, score, findings, summary) are JSON-encoded inside
 * `violationsJson`.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  ComplianceFinding,
  ComplianceReport,
  ComplianceScanResult,
  ComplianceStandard,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ComplianceScanInput } from "./schema.js";

const log = createLogger("compliance");

const STANDARDS_KEY = "compliance:standards";
const RESULTS_KEY = "compliance:results";
const detailKey = (id: string): string => `compliance:result:${id}`;
const REPORTS_KEY = "compliance:reports";

function invalidate(id?: string): void {
  cache.delete(RESULTS_KEY);
  cache.delete(REPORTS_KEY);
  if (id) cache.delete(detailKey(id));
}

// ─── Seed: 5 compliance standards ────────────────────────────────────────
const SEED_STANDARDS: ComplianceStandard[] = [
  {
    id: "wcag-22-aa",
    name: "WCAG 2.2 Level AA",
    code: "WCAG2.2-AA",
    level: "AA",
    description:
      "Web Content Accessibility Guidelines 2.2 — conformance level AA (industry baseline).",
    criteriaCount: 50,
    region: "Global",
  },
  {
    id: "wcag-22-aaa",
    name: "WCAG 2.2 Level AAA",
    code: "WCAG2.2-AAA",
    level: "AAA",
    description:
      "Web Content Accessibility Guidelines 2.2 — conformance level AAA (highest).",
    criteriaCount: 78,
    region: "Global",
  },
  {
    id: "ada",
    name: "Americans with Disabilities Act (ADA)",
    code: "ADA",
    level: "—",
    description:
      "US civil-rights law; web compliance is generally benchmarked to WCAG 2.1 AA.",
    criteriaCount: 50,
    region: "United States",
  },
  {
    id: "section-508",
    name: "Section 508",
    code: "SEC508",
    level: "AA",
    description:
      "US federal accessibility standard for information technology; maps to WCAG 2.0 AA.",
    criteriaCount: 38,
    region: "United States (Federal)",
  },
  {
    id: "en-301-549",
    name: "EN 301 549",
    code: "EN301549",
    level: "AA",
    description:
      "European accessibility standard for ICT products and services; references WCAG 2.1 AA.",
    criteriaCount: 50,
    region: "European Union",
  },
];

// ─── Seed: 3 sample scan results ─────────────────────────────────────────
const SEED_RESULTS: ComplianceScanResult[] = [
  {
    id: "scan-1",
    url: "https://marketing.roycss.cloud",
    standardId: "wcag-22-aa",
    standardName: "WCAG 2.2 Level AA",
    scannedAt: "2025-02-26T10:14:00.000Z",
    score: 92,
    status: "pass",
    findings: [
      {
        criterion: "1.4.3 Contrast (Minimum)",
        severity: "minor",
        element: "footer a",
        message: "Link color contrast ratio is 4.31:1 (minimum 4.5:1).",
        remediation: "Darken link color by ~5% to reach 4.5:1.",
      },
    ],
    summary: { critical: 0, serious: 0, moderate: 0, minor: 1 },
  },
  {
    id: "scan-2",
    url: "https://docs.roycss.cloud",
    standardId: "wcag-22-aa",
    standardName: "WCAG 2.2 Level AA",
    scannedAt: "2025-02-25T08:02:00.000Z",
    score: 78,
    status: "warn",
    findings: [
      {
        criterion: "1.4.11 Non-text Contrast",
        severity: "serious",
        element: "button.btn-ghost",
        message: "Ghost button border contrast is 2.8:1 (minimum 3:1).",
        remediation: "Increase border color to meet 3:1 against background.",
      },
      {
        criterion: "2.4.7 Focus Visible",
        severity: "moderate",
        element: "input[type=text]",
        message: "Focus ring is removed by outline:none with no replacement.",
        remediation: "Provide a visible focus indicator (e.g. box-shadow).",
      },
      {
        criterion: "4.1.2 Name, Role, Value",
        severity: "moderate",
        element: "div[role=tab]",
        message: "Tab is missing an accessible name.",
        remediation: "Add aria-label or visible text inside the tab.",
      },
    ],
    summary: { critical: 0, serious: 1, moderate: 2, minor: 0 },
  },
  {
    id: "scan-3",
    url: "https://staging-app.roycss.cloud",
    standardId: "wcag-22-aaa",
    standardName: "WCAG 2.2 Level AAA",
    scannedAt: "2025-02-24T17:48:00.000Z",
    score: 61,
    status: "fail",
    findings: [
      {
        criterion: "1.4.6 Contrast (Enhanced)",
        severity: "critical",
        element: "body",
        message: "Body text contrast is 4.2:1 (AAA requires 7:1).",
        remediation: "Switch body text to a darker shade (e.g. #0b0f14 on #fff).",
      },
      {
        criterion: "2.1.1 Keyboard",
        severity: "serious",
        element: "div.dnd-handle",
        message: "Drag handle is not operable with a keyboard.",
        remediation: "Add tabindex and arrow-key handlers for reordering.",
      },
      {
        criterion: "3.2.4 Consistent Identification",
        severity: "moderate",
        element: "button.icon-close",
        message: "Close icon button has inconsistent labels across pages.",
        remediation: "Standardize aria-label='Close' across all close buttons.",
      },
    ],
    summary: { critical: 1, serious: 1, moderate: 1, minor: 0 },
  },
];

// ─── Seed: 2 reports (static — no Prisma model) ────────────────────────
const SEED_REPORTS: ComplianceReport[] = [
  {
    id: "report-q1-2025",
    name: "Q1 2025 Accessibility Report",
    generatedAt: "2025-02-28T09:00:00.000Z",
    projectsScanned: 12,
    averageScore: 84,
    topIssues: [
      { criterion: "1.4.3 Contrast (Minimum)", occurrences: 23 },
      { criterion: "2.4.7 Focus Visible", occurrences: 17 },
      { criterion: "4.1.2 Name, Role, Value", occurrences: 11 },
      { criterion: "1.4.11 Non-text Contrast", occurrences: 8 },
    ],
  },
  {
    id: "report-feb-2025",
    name: "February 2025 Compliance Audit",
    generatedAt: "2025-02-15T16:30:00.000Z",
    projectsScanned: 8,
    averageScore: 79,
    topIssues: [
      { criterion: "1.4.3 Contrast (Minimum)", occurrences: 14 },
      { criterion: "2.1.1 Keyboard", occurrences: 6 },
    ],
  },
];

interface StandardMeta {
  level: ComplianceStandard["level"];
  criteriaCount: number;
  region: string;
}

function standardToDb(s: ComplianceStandard) {
  const meta: StandardMeta = {
    level: s.level,
    criteriaCount: s.criteriaCount,
    region: s.region,
  };
  return {
    id: s.id,
    slug: s.id,
    name: s.name,
    description: JSON.stringify({ text: s.description, meta }),
    framework: s.code,
  };
}

function standardToDomain(row: {
  id: string;
  name: string;
  description: string;
  framework: string;
}): ComplianceStandard {
  let text = row.description;
  let meta: StandardMeta = {
    level: "—",
    criteriaCount: 0,
    region: "",
  };
  try {
    const parsed = JSON.parse(row.description) as { text: string; meta: StandardMeta };
    text = parsed.text;
    meta = parsed.meta;
  } catch {
    // Keep description as text.
  }
  return {
    id: row.id,
    name: row.name,
    code: row.framework,
    level: meta.level,
    description: text,
    criteriaCount: meta.criteriaCount,
    region: meta.region,
  };
}

interface ScanWrapper {
  standardName: string;
  scannedAt: string;
  score: number;
  findings: ComplianceFinding[];
  summary: ComplianceScanResult["summary"];
}

function scanToDb(r: ComplianceScanResult) {
  const wrapper: ScanWrapper = {
    standardName: r.standardName,
    scannedAt: r.scannedAt,
    score: r.score,
    findings: r.findings,
    summary: r.summary,
  };
  return {
    id: r.id,
    standardId: r.standardId,
    url: r.url,
    status: r.status,
    violationsJson: JSON.stringify(wrapper),
  };
}

function scanToDomain(row: {
  id: string;
  standardId: string;
  url: string;
  status: string;
  violationsJson: string;
  createdAt: Date;
}): ComplianceScanResult {
  let wrapper: ScanWrapper = {
    standardName: "",
    scannedAt: row.createdAt.toISOString(),
    score: 0,
    findings: [],
    summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
  };
  try {
    wrapper = JSON.parse(row.violationsJson) as ScanWrapper;
  } catch {
    // Keep defaults.
  }
  return {
    id: row.id,
    url: row.url,
    standardId: row.standardId,
    standardName: wrapper.standardName,
    scannedAt: wrapper.scannedAt,
    score: wrapper.score,
    status: row.status as ComplianceScanResult["status"],
    findings: wrapper.findings.map((f) => ({ ...f })),
    summary: wrapper.summary,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const standardCount = await db.complianceStandard.count();
    if (standardCount === 0) {
      await db.complianceStandard.createMany({
        data: SEED_STANDARDS.map(standardToDb),
      });
    }
    const scanCount = await db.complianceScan.count();
    if (scanCount === 0) {
      await db.complianceScan.createMany({
        data: SEED_RESULTS.map(scanToDb),
      });
    }
    log.info("Compliance seeded", {
      standards: SEED_STANDARDS.length,
      scans: SEED_RESULTS.length,
    });
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all compliance standards. Cached. */
export async function listStandards(): Promise<ComplianceStandard[]> {
  return cacheWrap(
    STANDARDS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.complianceStandard.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(standardToDomain);
    },
    CACHE_TTL.complianceStandards,
  );
}

/** Get a single standard by id. Throws 404 if missing. */
export async function getStandardById(
  id: string,
): Promise<ComplianceStandard> {
  await seedIfEmpty();
  const row = await db.complianceStandard.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`Compliance standard '${id}' not found`);
  return standardToDomain(row);
}

/** List all scan results. Cached. */
export async function listResults(): Promise<ComplianceScanResult[]> {
  return cacheWrap(
    RESULTS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.complianceScan.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(scanToDomain);
    },
    CACHE_TTL.complianceResults,
  );
}

/** Get a single scan result by id. Cached. Throws 404 if missing. */
export async function getResultById(
  id: string,
): Promise<ComplianceScanResult> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.complianceScan.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Scan result '${id}' not found`);
      return scanToDomain(row);
    },
    CACHE_TTL.complianceResultDetail,
  );
}

/** List all compliance reports. Cached. */
export async function listReports(): Promise<ComplianceReport[]> {
  return cacheWrap(
    REPORTS_KEY,
    () =>
      Promise.resolve(
        SEED_REPORTS.map((r) => ({
          ...r,
          topIssues: r.topIssues.map((i) => ({ ...i })),
        })),
      ),
    CACHE_TTL.complianceReports,
  );
}

/** Run a compliance scan against a URL — returns a fresh scan result. */
export async function runScan(
  input: ComplianceScanInput,
): Promise<ComplianceScanResult> {
  const standard = await getStandardById(input.standardId);
  const id = `scan-${randomUUID()}`;
  const now = new Date().toISOString();

  // Deterministic mock findings — derive from URL hash so the same URL
  // yields a stable result across requests.
  const hash = simpleHash(input.url);
  const findingsCount = input.depth === "full" ? 4 : 2;
  const pool: ComplianceFinding[] = [
    {
      criterion: "1.4.3 Contrast (Minimum)",
      severity: "serious",
      element: "a.nav-link",
      message: "Link contrast ratio is 3.9:1 (minimum 4.5:1).",
      remediation: "Darken link color to reach 4.5:1 contrast.",
    },
    {
      criterion: "2.4.7 Focus Visible",
      severity: "moderate",
      element: "button.btn-ghost",
      message: "No visible focus indicator.",
      remediation: "Add a 2px outline or box-shadow on :focus-visible.",
    },
    {
      criterion: "4.1.2 Name, Role, Value",
      severity: "moderate",
      element: "div[role=tab]",
      message: "Tab is missing an accessible name.",
      remediation: "Add aria-label or visible text content.",
    },
    {
      criterion: "1.4.11 Non-text Contrast",
      severity: "minor",
      element: "input[type=checkbox]",
      message: "Checkbox border is 2.6:1 (minimum 3:1).",
      remediation: "Increase border color contrast.",
    },
  ];
  const findings: ComplianceFinding[] = pool
    .slice(hash % 2, (hash % 2) + findingsCount)
    .map((f) => ({ ...f }));

  const summary = {
    critical: findings.filter((f) => f.severity === "critical").length,
    serious: findings.filter((f) => f.severity === "serious").length,
    moderate: findings.filter((f) => f.severity === "moderate").length,
    minor: findings.filter((f) => f.severity === "minor").length,
  };
  const score = Math.max(0, 100 - summary.critical * 20 - summary.serious * 10 - summary.moderate * 5 - summary.minor * 2);
  const status: ComplianceScanResult["status"] =
    score >= 90 ? "pass" : score >= 70 ? "warn" : "fail";

  const result: ComplianceScanResult = {
    id,
    url: input.url,
    standardId: standard.id,
    standardName: standard.name,
    scannedAt: now,
    score,
    status,
    findings,
    summary,
  };

  await db.complianceScan.create({ data: scanToDb(result) });
  invalidate(id);
  log.info("Compliance scan completed", { id, url: input.url, score });
  return result;
}

/** Tiny string-hash — stable and fast; not cryptographic. */
function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Number of results in the store. Sync stub — real count is in DB. */
export function resultsCount(): number {
  return SEED_RESULTS.length;
}

/** Test-only: reset to seed. */
export function _resetComplianceForTest(): void {
  seedPromise = null;
  invalidate();
}

log.debug("Compliance module loaded", {
  standards: SEED_STANDARDS.length,
  results: SEED_RESULTS.length,
});
