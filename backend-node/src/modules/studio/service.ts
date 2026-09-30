/**
 * Studio service — Prisma-backed, OWNER-SCOPED Roy Studio visual-builder
 * project store (issue #267).
 *
 * Persisted via the Prisma `StudioProject` model. Starter templates
 * remain a static in-memory catalog (no Prisma model, public read —
 * there is no user data in them).
 *
 * Owner-scoping invariant (issue #267 — mirrors collections/favorites,
 * audit F-06): every query filters by the caller's `userId`, so a
 * project the caller doesn't own reads as a flat 404, never a 403 —
 * ids don't leak and one user's projects are invisible to another.
 *
 * Seeds: the four historical demo projects were written with
 * `userId: null` (owned by nobody). Under owner-scoping such rows are
 * invisible and immutable through the API (the `{ id, userId }` filter
 * never matches them), so the seeding path is discontinued — a fresh
 * database starts with an empty, fully-private project store. Legacy
 * owner-`null` rows in a deployed database stay inert; operators can
 * reclaim them with `DELETE FROM "StudioProject" WHERE "userId" IS NULL`.
 *
 * Field-mapping: the Prisma `StudioProject` model exposes (userId,
 * name, description, filesJson). The domain shape's `name`,
 * `description` map directly; the components tree is JSON-encoded
 * inside `filesJson`; (updatedAt, createdAt) are mirrored via the
 * Prisma `updatedAt`/`createdAt` columns. Reads/writes of owned rows
 * are not cached (the collections convention — the previous global
 * list/detail cache keys were per-module, not per-user, and would have
 * leaked rows across callers).
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  StudioComponent,
  StudioProject,
  StudioTemplate,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type {
  CreateStudioProjectInput,
  UpdateStudioProjectInput,
} from "./schema.js";

const log = createLogger("studio");

const TEMPLATES_KEY = "studio:templates";

// ─── Starter templates: 6 static entries (no Prisma model) ────────────
const SEED_TEMPLATES: StudioTemplate[] = [
  { id: "tpl-studio-blank", name: "Blank Canvas", category: "starter", description: "Empty project — start from scratch.", thumbnail: "https://cdn.roycss.dev/studio/blank.png", componentCount: 0 },
  { id: "tpl-studio-landing", name: "Landing Page", category: "marketing", description: "Hero + features + pricing + footer.", thumbnail: "https://cdn.roycss.dev/studio/landing.png", componentCount: 4 },
  { id: "tpl-studio-dashboard", name: "Dashboard", category: "app", description: "Sidebar + KPIs + chart grid.", thumbnail: "https://cdn.roycss.dev/studio/dashboard.png", componentCount: 3 },
  { id: "tpl-studio-docs", name: "Docs Site", category: "marketing", description: "TOC + content + code blocks.", thumbnail: "https://cdn.roycss.dev/studio/docs.png", componentCount: 3 },
  { id: "tpl-studio-portfolio", name: "Portfolio", category: "personal", description: "Gallery + about + contact.", thumbnail: "https://cdn.roycss.dev/studio/portfolio.png", componentCount: 4 },
  { id: "tpl-studio-blog", name: "Blog", category: "publishing", description: "Featured post + article list + tags.", thumbnail: "https://cdn.roycss.dev/studio/blog.png", componentCount: 3 },
];

interface ProjectWrapper {
  components: StudioComponent[];
  seedUpdatedAt: string;
  seedCreatedAt: string;
}

/** Owner attribution: the row belongs to the authenticated creator. */
function toDbRow(p: StudioProject, userId: string) {
  const wrapper: ProjectWrapper = {
    components: p.components,
    seedUpdatedAt: p.updatedAt,
    seedCreatedAt: p.createdAt,
  };
  return {
    id: p.id,
    userId,
    name: p.name,
    description: p.description,
    filesJson: JSON.stringify(wrapper),
  };
}

function toDomain(row: {
  id: string;
  name: string;
  description: string;
  filesJson: string;
  createdAt: Date;
  updatedAt: Date;
}): StudioProject {
  let wrapper: ProjectWrapper = {
    components: [],
    seedUpdatedAt: row.updatedAt.toISOString(),
    seedCreatedAt: row.createdAt.toISOString(),
  };
  try {
    wrapper = JSON.parse(row.filesJson) as ProjectWrapper;
  } catch {
    // Keep defaults.
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    components: wrapper.components,
    updatedAt: wrapper.seedUpdatedAt,
    createdAt: wrapper.seedCreatedAt,
  };
}

function parseWrapper(row: {
  filesJson: string;
  createdAt: Date;
  updatedAt: Date;
}): ProjectWrapper {
  try {
    return JSON.parse(row.filesJson) as ProjectWrapper;
  } catch {
    return {
      components: [],
      seedUpdatedAt: row.updatedAt.toISOString(),
      seedCreatedAt: row.createdAt.toISOString(),
    };
  }
}

/** Fetch one of the caller's projects or throw a flat 404 (issue #267).
 *  The `userId` in the filter means foreign ids AND legacy owner-`null`
 *  seed rows are indistinguishable from unknown ids — no data leaks. */
async function getOwned(userId: string, id: string) {
  const row = await db.studioProject.findFirst({ where: { id, userId } });
  if (!row) throw AppError.notFound("Studio project not found");
  return row;
}

/** List the caller's studio projects (oldest first). Not cached. */
export async function listProjects(userId: string): Promise<StudioProject[]> {
  const rows = await db.studioProject.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDomain);
}

/** Get one of the caller's studio projects by id (flat 404 otherwise). */
export async function getProjectById(
  userId: string,
  id: string,
): Promise<StudioProject> {
  const row = await getOwned(userId, id);
  return toDomain(row);
}

/** Create a studio project attributed to the caller. */
export async function createProject(
  userId: string,
  input: CreateStudioProjectInput,
): Promise<StudioProject> {
  const now = new Date().toISOString();
  const project: StudioProject = {
    id: `studio-proj-${randomUUID()}`,
    name: input.name,
    description: input.description,
    components: input.components,
    updatedAt: now,
    createdAt: now,
  };
  await db.studioProject.create({ data: toDbRow(project, userId) });
  log.info("Studio project created", {
    id: project.id,
    name: project.name,
    userId,
  });
  return project;
}

/** Update one of the caller's projects (partial). Flat 404 otherwise. */
export async function updateProject(
  userId: string,
  id: string,
  input: UpdateStudioProjectInput,
): Promise<StudioProject> {
  const row = await getOwned(userId, id);
  const wrapper = parseWrapper(row);
  const updatedName = input.name ?? row.name;
  const updatedDescription = input.description ?? row.description;
  const updatedComponents = input.components ?? wrapper.components;
  const now = new Date().toISOString();
  const updatedWrapper: ProjectWrapper = {
    components: updatedComponents,
    seedUpdatedAt: now,
    seedCreatedAt: wrapper.seedCreatedAt,
  };
  const updated = await db.studioProject.update({
    where: { id: row.id },
    data: {
      name: updatedName,
      description: updatedDescription,
      filesJson: JSON.stringify(updatedWrapper),
    },
  });
  log.info("Studio project updated", { id, userId });
  return toDomain(updated);
}

/** Delete one of the caller's projects. Flat 404 otherwise. */
export async function deleteProject(userId: string, id: string): Promise<void> {
  const row = await getOwned(userId, id);
  await db.studioProject.delete({ where: { id: row.id } });
  log.info("Studio project deleted", { id, userId });
}

/** List all studio starter templates. Cached (static public catalog). */
export async function listTemplates(): Promise<StudioTemplate[]> {
  return cacheWrap(
    TEMPLATES_KEY,
    () => Promise.resolve(SEED_TEMPLATES.map((t) => ({ ...t }))),
    CACHE_TTL.studioTemplates,
  );
}
