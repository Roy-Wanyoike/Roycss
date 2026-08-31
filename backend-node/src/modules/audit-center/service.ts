/**
 * Audit Center service — Prisma-backed project / issue / trend store.
 *
 * Persisted via the `AuditProject` + `AuditResult` Prisma models.
 * Seeds 5 monitored projects with audit scores and 10 audit issues
 * on first access. All reads are LRU-cached.
 *
 * Field-mapping: the Prisma `AuditProject` model exposes
 * (name, description, url, status, lastAuditAt). The domain shape
 * carries extra (score, categories) which are JSON-encoded inside
 * `description`. The Prisma `AuditResult` row stores one project's
 * issues array in `violationsJson` (so issues can be queried per
 * project) and the project's audit score in `score`.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  AuditIssue,
  AuditProject,
  AuditTrendPoint,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("audit-center");

const PROJECTS_KEY = "audit:projects";
const detailKey = (id: string): string => `audit:project:${id}`;
const ISSUES_KEY = "audit:issues";
const TRENDS_KEY = "audit:trends";

/** Wrapper for the extra domain metadata not in the Prisma schema. */
interface ProjectMeta {
  score: number;
  categories: { name: string; score: number }[];
}

// ─── Seed: 5 audit projects ──────────────────────────────────────────────
const SEED_PROJECTS: AuditProject[] = [
  {
    id: "audit-proj-marketing",
    name: "Marketing Site",
    url: "https://marketing.roycss.cloud",
    score: 92,
    status: "passing",
    lastAudit: "2025-02-26T10:14:00.000Z",
    categories: [
      { name: "Performance", score: 95 },
      { name: "Accessibility", score: 92 },
      { name: "Best Practices", score: 90 },
      { name: "SEO", score: 94 },
    ],
  },
  {
    id: "audit-proj-docs",
    name: "Docs Portal",
    url: "https://docs.roycss.cloud",
    score: 78,
    status: "warning",
    lastAudit: "2025-02-25T08:02:00.000Z",
    categories: [
      { name: "Performance", score: 72 },
      { name: "Accessibility", score: 78 },
      { name: "Best Practices", score: 85 },
      { name: "SEO", score: 80 },
    ],
  },
  {
    id: "audit-proj-staging",
    name: "Staging App",
    url: "https://staging-app.roycss.cloud",
    score: 61,
    status: "failing",
    lastAudit: "2025-02-24T17:48:00.000Z",
    categories: [
      { name: "Performance", score: 58 },
      { name: "Accessibility", score: 61 },
      { name: "Best Practices", score: 70 },
      { name: "SEO", score: 55 },
    ],
  },
  {
    id: "audit-proj-shop",
    name: "Shop Frontend",
    url: "https://shop.roycss.cloud",
    score: 88,
    status: "passing",
    lastAudit: "2025-02-23T12:30:00.000Z",
    categories: [
      { name: "Performance", score: 90 },
      { name: "Accessibility", score: 86 },
      { name: "Best Practices", score: 92 },
      { name: "SEO", score: 84 },
    ],
  },
  {
    id: "audit-proj-blog",
    name: "Engineering Blog",
    url: "https://blog.roycss.cloud",
    score: 83,
    status: "passing",
    lastAudit: "2025-02-22T09:15:00.000Z",
    categories: [
      { name: "Performance", score: 85 },
      { name: "Accessibility", score: 80 },
      { name: "Best Practices", score: 88 },
      { name: "SEO", score: 92 },
    ],
  },
];

// ─── Seed: 10 audit issues ───────────────────────────────────────────────
const SEED_ISSUES: AuditIssue[] = [
  {
    id: "issue-1",
    projectId: "audit-proj-marketing",
    title: "Footer link contrast below 4.5:1",
    severity: "minor",
    category: "accessibility",
    status: "open",
    detectedAt: "2025-02-26T10:14:00.000Z",
  },
  {
    id: "issue-2",
    projectId: "audit-proj-docs",
    title: "Ghost button border contrast 2.8:1",
    severity: "serious",
    category: "accessibility",
    status: "in-progress",
    detectedAt: "2025-02-25T08:02:00.000Z",
  },
  {
    id: "issue-3",
    projectId: "audit-proj-docs",
    title: "Missing focus indicator on inputs",
    severity: "moderate",
    category: "accessibility",
    status: "open",
    detectedAt: "2025-02-25T08:02:00.000Z",
  },
  {
    id: "issue-4",
    projectId: "audit-proj-docs",
    title: "Tab component missing accessible name",
    severity: "moderate",
    category: "accessibility",
    status: "resolved",
    detectedAt: "2025-02-24T11:10:00.000Z",
  },
  {
    id: "issue-5",
    projectId: "audit-proj-staging",
    title: "Body text contrast 4.2:1 (AAA requires 7:1)",
    severity: "critical",
    category: "accessibility",
    status: "open",
    detectedAt: "2025-02-24T17:48:00.000Z",
  },
  {
    id: "issue-6",
    projectId: "audit-proj-staging",
    title: "Drag handle not keyboard operable",
    severity: "serious",
    category: "accessibility",
    status: "in-progress",
    detectedAt: "2025-02-24T17:48:00.000Z",
  },
  {
    id: "issue-7",
    projectId: "audit-proj-staging",
    title: "Largest Contentful Paint > 4s",
    severity: "serious",
    category: "performance",
    status: "open",
    detectedAt: "2025-02-24T17:48:00.000Z",
  },
  {
    id: "issue-8",
    projectId: "audit-proj-shop",
    title: "Image missing alt attribute",
    severity: "moderate",
    category: "accessibility",
    status: "resolved",
    detectedAt: "2025-02-23T12:30:00.000Z",
  },
  {
    id: "issue-9",
    projectId: "audit-proj-blog",
    title: "Missing meta description on /posts/*",
    severity: "moderate",
    category: "seo",
    status: "open",
    detectedAt: "2025-02-22T09:15:00.000Z",
  },
  {
    id: "issue-10",
    projectId: "audit-proj-blog",
    title: "Inline script blocks rendering",
    severity: "minor",
    category: "performance",
    status: "resolved",
    detectedAt: "2025-02-22T09:15:00.000Z",
  },
];

// ─── Seed: 6-month trend ─────────────────────────────────────────────────
const SEED_TRENDS: AuditTrendPoint[] = [
  { month: "2024-09", score: 72, issues: 28 },
  { month: "2024-10", score: 76, issues: 24 },
  { month: "2024-11", score: 79, issues: 21 },
  { month: "2024-12", score: 81, issues: 19 },
  { month: "2025-01", score: 84, issues: 15 },
  { month: "2025-02", score: 87, issues: 12 },
];

/** Map an AuditProject domain object to a Prisma row. */
function projectToDb(p: AuditProject) {
  const meta: ProjectMeta = { score: p.score, categories: p.categories };
  return {
    id: p.id,
    userId: null,
    name: p.name,
    description: JSON.stringify(meta),
    url: p.url,
    status: p.status,
    lastAuditAt: new Date(p.lastAudit),
  };
}

/** Map a Prisma AuditProject row to the domain AuditProject. */
function projectToDomain(row: {
  id: string;
  name: string;
  description: string;
  url: string;
  status: string;
  lastAuditAt: Date | null;
}): AuditProject {
  let meta: ProjectMeta = { score: 0, categories: [] };
  try {
    meta = JSON.parse(row.description) as ProjectMeta;
  } catch {
    // Keep defaults.
  }
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    score: meta.score,
    status: row.status as AuditProject["status"],
    lastAudit: row.lastAuditAt ? row.lastAuditAt.toISOString() : new Date(0).toISOString(),
    categories: meta.categories.map((c) => ({ ...c })),
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const projectCount = await db.auditProject.count();
    if (projectCount === 0) {
      await db.auditProject.createMany({
        data: SEED_PROJECTS.map(projectToDb),
      });
    }
    const resultCount = await db.auditResult.count();
    if (resultCount === 0) {
      // Group issues by projectId.
      const byProject = new Map<string, AuditIssue[]>();
      for (const issue of SEED_ISSUES) {
        const arr = byProject.get(issue.projectId) ?? [];
        arr.push(issue);
        byProject.set(issue.projectId, arr);
      }
      const rows = [...byProject.entries()].map(([projectId, issues]) => {
        const project = SEED_PROJECTS.find((p) => p.id === projectId);
        return {
          projectId,
          summaryJson: JSON.stringify({ count: issues.length }),
          violationsJson: JSON.stringify(issues),
          score: project?.score ?? 0,
        };
      });
      await db.auditResult.createMany({ data: rows });
    }
    log.debug("Audit Center seeded", {
      projects: SEED_PROJECTS.length,
      issueGroups: SEED_ISSUES.length,
    });
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all audit projects. Cached. */
export async function listProjects(): Promise<AuditProject[]> {
  return cacheWrap(
    PROJECTS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.auditProject.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(projectToDomain);
    },
    CACHE_TTL.auditProjects,
  );
}

/** Get a single audit project by id. Cached. Throws 404 if missing. */
export async function getProjectById(id: string): Promise<AuditProject> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.auditProject.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Audit project '${id}' not found`);
      return projectToDomain(row);
    },
    CACHE_TTL.auditProjectDetail,
  );
}

/** List all audit issues (optionally filtered by ?projectId= or ?status=). */
export async function listIssues(
  filters: { projectId?: string; status?: string } = {},
): Promise<AuditIssue[]> {
  return cacheWrap(
    `${ISSUES_KEY}:${filters.projectId ?? "all"}:${filters.status ?? "all"}`,
    async () => {
      await seedIfEmpty();
      const rows = filters.projectId
        ? await db.auditResult.findMany({ where: { projectId: filters.projectId } })
        : await db.auditResult.findMany();
      const all: AuditIssue[] = [];
      for (const r of rows) {
        try {
          const arr = JSON.parse(r.violationsJson) as AuditIssue[];
          for (const issue of arr) all.push({ ...issue });
        } catch {
          // Skip malformed.
        }
      }
      const filtered = all.filter((i) => {
        if (filters.projectId && i.projectId !== filters.projectId) return false;
        if (filters.status && i.status !== filters.status) return false;
        return true;
      });
      return filtered;
    },
    CACHE_TTL.auditIssues,
  );
}

/** 6-month trend data — average score + open issues over time. Cached. */
export async function getTrends(): Promise<AuditTrendPoint[]> {
  return cacheWrap(
    TRENDS_KEY,
    () => Promise.resolve(SEED_TRENDS.map((t) => ({ ...t }))),
    CACHE_TTL.auditTrends,
  );
}

/** Number of projects in the store. Sync stub — real count is in DB. */
export function projectsCount(): number {
  return SEED_PROJECTS.length;
}

log.debug("Audit Center module loaded", {
  projects: SEED_PROJECTS.length,
  issues: SEED_ISSUES.length,
});
