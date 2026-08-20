/**
 * Open service — Prisma-backed Roy Open (open-source community hub).
 *
 * Persisted via the `GoodFirstIssue`, `RFC`, `Roadmap`, `Contributor`
 * Prisma models. Seeds 5 good-first-issues, 3 RFCs, a 4-quarter
 * roadmap (as a single Roadmap row), and 5 top contributors.
 *
 * Field-mapping notes:
 *   - GoodFirstIssue Prisma (title, description, repo, url, difficulty,
 *     tagsJson, status). Domain's extra (labels, assignee, comments)
 *     → JSON in `tagsJson`; description ← "" (the seed has no
 *     long-form description field).
 *   - RFC Prisma (title, description, status, content, authorId).
 *     Domain's extra (summary, votes, comments) → JSON in `description`
 *     as a wrapper. `summary` is also stored in `description.text` for
 *     round-tripping.
 *   - Roadmap Prisma (title, description, status, quarter, itemsJson).
 *     The entire roadmap is stored as a single row; `itemsJson` carries
 *     the full { year, quarters } wrapper.
 *   - Contributor Prisma (githubLogin, name, avatarUrl, commitsCount).
 *     Domain's extra (repos, role, badges) → looked up from the static
 *     seed map keyed by id; `handle ← githubLogin`, `avatar ← avatarUrl`,
 *     `contributions ← commitsCount`.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  Contributor,
  GoodFirstIssue,
  OpenRoadmap,
  RFC,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { RfcVoteInput } from "./schema.js";

const log = createLogger("open");

const ISSUES_KEY = "open:issues";
const RFCS_KEY = "open:rfcs";
const ROADMAP_KEY = "open:roadmap";
const CONTRIBUTORS_KEY = "open:contributors";
const issueKey = (id: string): string => `open:issue:${id}`;
const rfcKey = (id: string): string => `open:rfc:${id}`;

function invalidateRfc(id: string): void {
  cache.delete(RFCS_KEY);
  cache.delete(rfcKey(id));
}

// ─── Seed: 5 good-first-issues ──────────────────────────────────────────
const SEED_ISSUES: GoodFirstIssue[] = [
  {
    id: "gfi-001",
    title: "Add prefers-reduced-motion variants for hover effects",
    repo: "roycss/core",
    labels: ["good-first-issue", "accessibility", "effects"],
    assignee: null,
    comments: 4,
    url: "https://github.com/roycss/core/issues/1234",
    createdAt: "2025-02-10T12:00:00.000Z",
  },
  {
    id: "gfi-002",
    title: "Document the recipe schema in the contributor guide",
    repo: "roycss/docs",
    labels: ["good-first-issue", "documentation"],
    assignee: null,
    comments: 2,
    url: "https://github.com/roycss/docs/issues/89",
    createdAt: "2025-02-12T09:30:00.000Z",
  },
  {
    id: "gfi-003",
    title: "Add unit tests for the contrast checker utility",
    repo: "roycss/cli",
    labels: ["good-first-issue", "testing"],
    assignee: null,
    comments: 1,
    url: "https://github.com/roycss/cli/issues/56",
    createdAt: "2025-02-13T16:10:00.000Z",
  },
  {
    id: "gfi-004",
    title: "Improve error message when effect import fails",
    repo: "roycss/core",
    labels: ["good-first-issue", "DX"],
    assignee: null,
    comments: 0,
    url: "https://github.com/roycss/core/issues/1301",
    createdAt: "2025-02-15T11:00:00.000Z",
  },
  {
    id: "gfi-005",
    title: "Add Chinese (zh-CN) translations for the playground UI",
    repo: "roycss/i18n",
    labels: ["good-first-issue", "i18n", "localization"],
    assignee: null,
    comments: 3,
    url: "https://github.com/roycss/i18n/issues/22",
    createdAt: "2025-02-16T14:45:00.000Z",
  },
];

// ─── Seed: 3 RFCs ────────────────────────────────────────────────────────
const SEED_RFCS: RFC[] = [
  {
    id: "rfc-001",
    title: "Container query utilities (roycss/cq-*)",
    status: "open",
    author: "user-roy",
    summary:
      "Proposal for first-class container-query utilities that mirror the existing responsive scale.",
    body: "## Motivation\n\nContainer queries have shipped in all evergreen browsers. We should expose utilities that map cleanly onto the existing roycss scale.\n\n## Proposal\n\n- `cq-sm`, `cq-md`, `cq-lg` variants\n- Opt-in via the `@container` directive\n- Backwards-compatible fallback using `min-width` media queries",
    votes: { for: 24, against: 3, neutral: 5 },
    comments: 18,
    createdAt: "2025-02-01T10:00:00.000Z",
    updatedAt: "2025-02-18T08:00:00.000Z",
  },
  {
    id: "rfc-002",
    title: "Adopt :has() as a first-class selector",
    status: "open",
    author: "user-mira",
    summary:
      "Use :has() to power a new family of parent-state utilities across the framework.",
    body: "## Motivation\n\n`:has()` is now Baseline. We can replace JavaScript-driven parent-state patterns with pure CSS.\n\n## Proposal\n\n- `has-[.active]:bg-blue-500` syntax\n- Documented browser-support caveats for legacy engines",
    votes: { for: 41, against: 1, neutral: 2 },
    comments: 22,
    createdAt: "2025-02-03T11:30:00.000Z",
    updatedAt: "2025-02-19T09:15:00.000Z",
  },
  {
    id: "rfc-003",
    title: "CSS-first theming via light-dark()",
    status: "draft",
    author: "user-asha",
    summary:
      "Adopt the new light-dark() function as the default theming primitive, deprecating the JS theme switch.",
    body: "## Motivation\n\n`light-dark()` removes the need for a `.dark` class on the root element.\n\n## Proposal\n\n- New `theme-light()` / `theme-dark()` helpers\n- Migration codemod for existing users",
    votes: { for: 12, against: 8, neutral: 9 },
    comments: 31,
    createdAt: "2025-02-08T13:00:00.000Z",
    updatedAt: "2025-02-17T15:00:00.000Z",
  },
];

// ─── Seed: 4-quarter roadmap ─────────────────────────────────────────────
const SEED_ROADMAP: OpenRoadmap = {
  year: 2025,
  quarters: [
    {
      quarter: "Q1",
      title: "Foundation",
      goals: [
        "Ship the new documentation site",
        "Stabilize the CLI plugin API",
        "Reach 1,000 effects in the registry",
      ],
      status: "in-progress",
    },
    {
      quarter: "Q2",
      title: "Performance",
      goals: [
        "Cut initial bundle by 30%",
        "Native container-query utilities",
        "Ship Roy Observatory GA",
      ],
      status: "planned",
    },
    {
      quarter: "Q3",
      title: "Ecosystem",
      goals: [
        "Open the Plugin Marketplace to third-party authors",
        "Launch the Roy Certifications program",
        "Establish the RFC cadence",
      ],
      status: "planned",
    },
    {
      quarter: "Q4",
      title: "Scale",
      goals: [
        "Multi-region Roy Cloud",
        "Enterprise SSO + audit log",
        "1 million npm installs / month",
      ],
      status: "exploratory",
    },
  ],
};

// ─── Seed: 5 top contributors ────────────────────────────────────────────
const SEED_CONTRIBUTORS: Contributor[] = [
  {
    id: "contrib-roy",
    name: "Roy",
    handle: "@roy",
    avatar: "https://avatars.githubusercontent.com/u/1?v=4",
    contributions: 1842,
    repos: 12,
    role: "maintainer",
    badges: ["founder", "core", "architect"],
  },
  {
    id: "contrib-mira",
    name: "Mira Chen",
    handle: "@miracss",
    avatar: "https://avatars.githubusercontent.com/u/2?v=4",
    contributions: 731,
    repos: 8,
    role: "maintainer",
    badges: ["core", "effects-lead"],
  },
  {
    id: "contrib-devon",
    name: "Devon Park",
    handle: "@devp",
    avatar: "https://avatars.githubusercontent.com/u/3?v=4",
    contributions: 514,
    repos: 6,
    role: "contributor",
    badges: ["docs", "tooling"],
  },
  {
    id: "contrib-asha",
    name: "Asha Patel",
    handle: "@ashadev",
    avatar: "https://avatars.githubusercontent.com/u/4?v=4",
    contributions: 412,
    repos: 5,
    role: "contributor",
    badges: ["a11y", "themes-lead"],
  },
  {
    id: "contrib-priya",
    name: "Priya Rao",
    handle: "@priyar",
    avatar: "https://avatars.githubusercontent.com/u/5?v=4",
    contributions: 308,
    repos: 4,
    role: "contributor",
    badges: ["i18n", "community"],
  },
];

// Lookup map for contributor extras not in the Prisma schema.
const CONTRIBUTOR_EXTRAS = new Map<
  string,
  { repos: number; role: Contributor["role"]; badges: string[] }
>(
  SEED_CONTRIBUTORS.map((c) => [
    c.id,
    { repos: c.repos, role: c.role, badges: c.badges },
  ]),
);

interface IssueWrapper {
  labels: string[];
  assignee: string | null;
  comments: number;
  createdAt: string;
}

interface RfcWrapper {
  summary: string;
  votes: RFC["votes"];
  comments: number;
  createdAt: string;
  updatedAt: string;
}

function issueToDb(i: GoodFirstIssue) {
  const wrapper: IssueWrapper = {
    labels: i.labels,
    assignee: i.assignee,
    comments: i.comments,
    createdAt: i.createdAt,
  };
  return {
    id: i.id,
    title: i.title,
    description: "",
    repo: i.repo,
    url: i.url,
    difficulty: "easy",
    tagsJson: JSON.stringify(wrapper),
    status: "open",
  };
}

function issueToDomain(row: {
  id: string;
  title: string;
  description: string;
  repo: string;
  url: string;
  tagsJson: string;
  status: string;
  createdAt: Date;
}): GoodFirstIssue {
  let wrapper: IssueWrapper = {
    labels: [],
    assignee: null,
    comments: 0,
    createdAt: row.createdAt.toISOString(),
  };
  try {
    wrapper = JSON.parse(row.tagsJson) as IssueWrapper;
  } catch {
    // Keep defaults.
  }
  return {
    id: row.id,
    title: row.title,
    repo: row.repo,
    labels: wrapper.labels,
    assignee: wrapper.assignee,
    comments: wrapper.comments,
    url: row.url,
    createdAt: wrapper.createdAt,
  };
}

function rfcToDb(r: RFC) {
  const wrapper: RfcWrapper = {
    summary: r.summary,
    votes: r.votes,
    comments: r.comments,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
  return {
    id: r.id,
    title: r.title,
    description: JSON.stringify(wrapper),
    status: r.status,
    content: r.body,
    authorId: r.author,
  };
}

function rfcToDomain(row: {
  id: string;
  title: string;
  description: string;
  status: string;
  content: string;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): RFC {
  let wrapper: RfcWrapper = {
    summary: row.description,
    votes: { for: 0, against: 0, neutral: 0 },
    comments: 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  try {
    wrapper = JSON.parse(row.description) as RfcWrapper;
  } catch {
    // Keep defaults.
  }
  return {
    id: row.id,
    title: row.title,
    status: row.status as RFC["status"],
    author: row.authorId ?? "",
    summary: wrapper.summary,
    body: row.content,
    votes: wrapper.votes,
    comments: wrapper.comments,
    createdAt: wrapper.createdAt,
    updatedAt: wrapper.updatedAt,
  };
}

function roadmapToDb(r: OpenRoadmap) {
  return {
    id: `roadmap-${r.year}`,
    title: `${r.year} Roadmap`,
    description: `RoyCSS ${r.year} quarterly roadmap`,
    status: "in-progress",
    quarter: `FY${r.year}`,
    itemsJson: JSON.stringify(r),
  };
}

function roadmapToDomain(row: {
  id: string;
  itemsJson: string;
}): OpenRoadmap {
  try {
    return JSON.parse(row.itemsJson) as OpenRoadmap;
  } catch {
    return { year: 0, quarters: [] };
  }
}

function contributorToDb(c: Contributor) {
  return {
    id: c.id,
    githubLogin: c.handle,
    name: c.name,
    avatarUrl: c.avatar,
    commitsCount: c.contributions,
  };
}

function contributorToDomain(row: {
  id: string;
  githubLogin: string;
  name: string | null;
  avatarUrl: string | null;
  commitsCount: number;
}): Contributor {
  const extras = CONTRIBUTOR_EXTRAS.get(row.id) ?? {
    repos: 0,
    role: "contributor" as Contributor["role"],
    badges: [],
  };
  return {
    id: row.id,
    name: row.name ?? "",
    handle: row.githubLogin,
    avatar: row.avatarUrl ?? "",
    contributions: row.commitsCount,
    repos: extras.repos,
    role: extras.role,
    badges: extras.badges,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    if ((await db.goodFirstIssue.count()) === 0) {
      await db.goodFirstIssue.createMany({ data: SEED_ISSUES.map(issueToDb) });
    }
    if ((await db.rFC.count()) === 0) {
      await db.rFC.createMany({ data: SEED_RFCS.map(rfcToDb) });
    }
    if ((await db.roadmap.count()) === 0) {
      await db.roadmap.create({ data: roadmapToDb(SEED_ROADMAP) });
    }
    if ((await db.contributor.count()) === 0) {
      await db.contributor.createMany({
        data: SEED_CONTRIBUTORS.map(contributorToDb),
      });
    }
    log.info("Open seeded", {
      issues: SEED_ISSUES.length,
      rfcs: SEED_RFCS.length,
      contributors: SEED_CONTRIBUTORS.length,
    });
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all open issues. Cached. */
export async function listIssues(): Promise<GoodFirstIssue[]> {
  return cacheWrap(
    ISSUES_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.goodFirstIssue.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(issueToDomain);
    },
    CACHE_TTL.openIssues,
  );
}

/** Get a single issue by id. Throws 404 if missing. */
export async function getIssueById(id: string): Promise<GoodFirstIssue> {
  return cacheWrap(
    issueKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.goodFirstIssue.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Issue '${id}' not found`);
      return issueToDomain(row);
    },
    CACHE_TTL.openIssueDetail,
  );
}

/** List all RFCs. Cached. */
export async function listRfcs(): Promise<RFC[]> {
  return cacheWrap(
    RFCS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.rFC.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(rfcToDomain);
    },
    CACHE_TTL.openRfcs,
  );
}

/** Get a single RFC by id. Throws 404 if missing. */
export async function getRfcById(id: string): Promise<RFC> {
  return cacheWrap(
    rfcKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.rFC.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`RFC '${id}' not found`);
      return rfcToDomain(row);
    },
    CACHE_TTL.openRfcDetail,
  );
}

/** Cast a vote on an RFC. Mutates state. */
export async function voteOnRfc(id: string, input: RfcVoteInput): Promise<RFC> {
  await seedIfEmpty();
  const row = await db.rFC.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`RFC '${id}' not found`);
  let wrapper: RfcWrapper;
  try {
    wrapper = JSON.parse(row.description) as RfcWrapper;
  } catch {
    wrapper = {
      summary: row.description,
      votes: { for: 0, against: 0, neutral: 0 },
      comments: 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  wrapper.votes = { ...wrapper.votes };
  wrapper.votes[input.vote] = wrapper.votes[input.vote] + 1;
  const now = new Date().toISOString();
  wrapper.updatedAt = now;
  await db.rFC.update({
    where: { id },
    data: { description: JSON.stringify(wrapper) },
  });
  invalidateRfc(id);
  log.info("RFC voted", { id, vote: input.vote });
  return rfcToDomain({
    ...row,
    description: JSON.stringify(wrapper),
  });
}

/** Get the 4-quarter roadmap. Cached. */
export async function getRoadmap(): Promise<OpenRoadmap> {
  return cacheWrap(
    ROADMAP_KEY,
    async () => {
      await seedIfEmpty();
      const row = await db.roadmap.findFirst();
      if (!row) throw AppError.notFound("Roadmap not found");
      return roadmapToDomain(row);
    },
    CACHE_TTL.openRoadmap,
  );
}

/** List top contributors. Cached. */
export async function getContributors(): Promise<Contributor[]> {
  return cacheWrap(
    CONTRIBUTORS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.contributor.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(contributorToDomain);
    },
    CACHE_TTL.openContributors,
  );
}

/** Test-only: reset to seed. */
export function _resetOpenForTest(): void {
  seedPromise = null;
  cache.delete(ISSUES_KEY);
  cache.delete(RFCS_KEY);
  cache.delete(ROADMAP_KEY);
  cache.delete(CONTRIBUTORS_KEY);
}

// Re-exported so a future audit endpoint can introspect.
export function _openStoreId(): string {
  return `open-${randomUUID()}`;
}
