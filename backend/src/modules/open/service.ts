/**
 * Open service — Roy Open (open-source community hub).
 *
 * Mock backend (no DB). Seeds 5 good-first-issues, 3 RFCs, a 4-quarter
 * roadmap, and 5 top contributors. Voting on an RFC mutates its tally.
 *
 * Reads are LRU-cached; voting invalidates the affected RFC caches.
 *
 * Future: persist via Prisma `Issue`/`RFC`/`Roadmap`/`Contributor` models
 * and integrate with the GitHub API for live data.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
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

let issues: GoodFirstIssue[] = SEED_ISSUES.map((i) => ({ ...i }));
let rfcs: RFC[] = SEED_RFCS.map((r) => ({ ...r }));
const roadmap: OpenRoadmap = { ...SEED_ROADMAP };
const contributors: Contributor[] = SEED_CONTRIBUTORS.map((c) => ({ ...c }));

/** List all open issues. Cached. */
export async function listIssues(): Promise<GoodFirstIssue[]> {
  return cacheWrap(
    ISSUES_KEY,
    () => Promise.resolve(issues.map((i) => ({ ...i }))),
    CACHE_TTL.openIssues,
  );
}

/** Get a single issue by id. Throws 404 if missing. */
export async function getIssueById(id: string): Promise<GoodFirstIssue> {
  return cacheWrap(
    issueKey(id),
    () => {
      const found = issues.find((i) => i.id === id);
      if (!found) throw AppError.notFound(`Issue '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.openIssueDetail,
  );
}

/** List all RFCs. Cached. */
export async function listRfcs(): Promise<RFC[]> {
  return cacheWrap(
    RFCS_KEY,
    () => Promise.resolve(rfcs.map((r) => ({ ...r, votes: { ...r.votes } }))),
    CACHE_TTL.openRfcs,
  );
}

/** Get a single RFC by id. Throws 404 if missing. */
export async function getRfcById(id: string): Promise<RFC> {
  return cacheWrap(
    rfcKey(id),
    () => {
      const found = rfcs.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`RFC '${id}' not found`);
      return Promise.resolve({ ...found, votes: { ...found.votes } });
    },
    CACHE_TTL.openRfcDetail,
  );
}

/** Cast a vote on an RFC. Mutates state. */
export async function voteOnRfc(id: string, input: RfcVoteInput): Promise<RFC> {
  const idx = rfcs.findIndex((r) => r.id === id);
  if (idx === -1) throw AppError.notFound(`RFC '${id}' not found`);
  const current = rfcs[idx]!;
  const votes = { ...current.votes };
  votes[input.vote] = votes[input.vote] + 1;
  const updated: RFC = {
    ...current,
    votes,
    updatedAt: new Date().toISOString(),
  };
  rfcs = rfcs.map((r) => (r.id === id ? updated : r));
  invalidateRfc(id);
  log.info("RFC voted", { id, vote: input.vote });
  return updated;
}

/** Get the 4-quarter roadmap. Cached. */
export async function getRoadmap(): Promise<OpenRoadmap> {
  return cacheWrap(
    ROADMAP_KEY,
    () => Promise.resolve({ ...roadmap, quarters: roadmap.quarters.map((q) => ({ ...q, goals: [...q.goals] })) }),
    CACHE_TTL.openRoadmap,
  );
}

/** List top contributors. Cached. */
export async function getContributors(): Promise<Contributor[]> {
  return cacheWrap(
    CONTRIBUTORS_KEY,
    () => Promise.resolve(contributors.map((c) => ({ ...c, badges: [...c.badges] }))),
    CACHE_TTL.openContributors,
  );
}

/** Test-only: reset to seed. */
export function _resetOpenForTest(): void {
  issues = SEED_ISSUES.map((i) => ({ ...i }));
  rfcs = SEED_RFCS.map((r) => ({ ...r }));
  cache.delete(ISSUES_KEY);
  cache.delete(RFCS_KEY);
  cache.delete(ROADMAP_KEY);
  cache.delete(CONTRIBUTORS_KEY);
}

// Re-exported so a future audit endpoint can introspect.
export function _openStoreId(): string {
  return `open-${randomUUID()}`;
}
