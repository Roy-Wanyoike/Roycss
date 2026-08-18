/**
 * Studio service — in-memory Roy Studio visual-builder project store.
 *
 * Mock backend (no DB). Seeds 4 studio projects (each with a components
 * tree) and 6 starter templates. All reads are LRU-cached; create/update/
 * delete invalidate the list + affected detail cache entry.
 *
 * Future: persist projects via Prisma `StudioProject` + a JSON column for
 * the components tree, or a recursive `StudioComponent` model.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
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

const PROJECTS_KEY = "studio:projects";
const detailKey = (id: string): string => `studio:project:${id}`;
const TEMPLATES_KEY = "studio:templates";

function invalidate(id?: string): void {
  cache.delete(PROJECTS_KEY);
  if (id) cache.delete(detailKey(id));
}

// ─── Seed: 4 studio projects with component trees ───────────────────────
function comp(
  type: string,
  props: Record<string, unknown> = {},
  children: StudioComponent[] = [],
): StudioComponent {
  return { id: `cmp-${randomUUID()}`, type, props, children };
}

const SEED_PROJECTS: StudioProject[] = [
  {
    id: "studio-proj-landing-page",
    name: "Landing Page",
    description: "Hero + feature grid + pricing + footer.",
    updatedAt: "2025-02-26T11:30:00.000Z",
    createdAt: "2025-02-20T09:00:00.000Z",
    components: [
      comp("Hero", { title: "Ship CSS faster", cta: "Get started" }, []),
      comp("FeatureGrid", { columns: 3 }, [
        comp("FeatureCard", { title: "Effects", icon: "sparkles" }, []),
        comp("FeatureCard", { title: "Themes", icon: "palette" }, []),
        comp("FeatureCard", { title: "Recipes", icon: "book" }, []),
      ]),
      comp("PricingTable", { tiers: ["starter", "pro", "team"] }, []),
      comp("Footer", {}, []),
    ],
  },
  {
    id: "studio-proj-dashboard",
    name: "Analytics Dashboard",
    description: "Sidebar + KPI cards + chart grid.",
    updatedAt: "2025-02-25T16:10:00.000Z",
    createdAt: "2025-02-18T14:00:00.000Z",
    components: [
      comp("Sidebar", { items: ["Overview", "Traffic", "Devices"] }, []),
      comp("MainContent", {}, [
        comp("KpiGrid", {}, [
          comp("KpiCard", { label: "Users", value: 48217 }, []),
          comp("KpiCard", { label: "API calls", value: 9_412_886 }, []),
          comp("KpiCard", { label: "Effects", value: 1284 }, []),
          comp("KpiCard", { label: "Avg ms", value: 87 }, []),
        ]),
        comp("ChartGrid", {}, [
          comp("LineChart", { data: "traffic-30d" }, []),
          comp("BarChart", { data: "devices" }, []),
        ]),
      ]),
    ],
  },
  {
    id: "studio-proj-docs-site",
    name: "Docs Site",
    description: "Sidebar TOC + content + code blocks.",
    updatedAt: "2025-02-24T08:45:00.000Z",
    createdAt: "2025-02-15T11:00:00.000Z",
    components: [
      comp("TopBar", { search: true }, []),
      comp("Sidebar", { items: ["Intro", "Effects", "Themes"] }, []),
      comp("DocContent", {}, [
        comp("Heading", { level: 1, text: "Getting Started" }, []),
        comp("Paragraph", { text: "Welcome to RoyCSS." }, []),
        comp("CodeBlock", { language: "bash", code: "npm i roycss" }, []),
      ]),
    ],
  },
  {
    id: "studio-proj-portfolio",
    name: "Portfolio",
    description: "Hero + project gallery + about + contact.",
    updatedAt: "2025-02-22T18:20:00.000Z",
    createdAt: "2025-02-10T10:00:00.000Z",
    components: [
      comp("Hero", { name: "Asha Roy", tagline: "Designer & Engineer" }, []),
      comp("ProjectGallery", { columns: 2 }, [
        comp("ProjectCard", { title: "RoyCSS", year: 2024 }, []),
        comp("ProjectCard", { title: "Mira Labs", year: 2023 }, []),
        comp("ProjectCard", { title: "Fleet UI", year: 2023 }, []),
        comp("ProjectCard", { title: "Open Climate", year: 2022 }, []),
      ]),
      comp("About", {}, []),
      comp("ContactForm", {}, []),
    ],
  },
];

// ─── Seed: 6 starter templates ───────────────────────────────────────────
const SEED_TEMPLATES: StudioTemplate[] = [
  { id: "tpl-studio-blank", name: "Blank Canvas", category: "starter", description: "Empty project — start from scratch.", thumbnail: "https://cdn.roycss.dev/studio/blank.png", componentCount: 0 },
  { id: "tpl-studio-landing", name: "Landing Page", category: "marketing", description: "Hero + features + pricing + footer.", thumbnail: "https://cdn.roycss.dev/studio/landing.png", componentCount: 4 },
  { id: "tpl-studio-dashboard", name: "Dashboard", category: "app", description: "Sidebar + KPIs + chart grid.", thumbnail: "https://cdn.roycss.dev/studio/dashboard.png", componentCount: 3 },
  { id: "tpl-studio-docs", name: "Docs Site", category: "marketing", description: "TOC + content + code blocks.", thumbnail: "https://cdn.roycss.dev/studio/docs.png", componentCount: 3 },
  { id: "tpl-studio-portfolio", name: "Portfolio", category: "personal", description: "Gallery + about + contact.", thumbnail: "https://cdn.roycss.dev/studio/portfolio.png", componentCount: 4 },
  { id: "tpl-studio-blog", name: "Blog", category: "publishing", description: "Featured post + article list + tags.", thumbnail: "https://cdn.roycss.dev/studio/blog.png", componentCount: 3 },
];

let projects: StudioProject[] = SEED_PROJECTS.map((p) => ({ ...p }));

/** Deep-clone a project (with its components tree). */
function cloneProject(p: StudioProject): StudioProject {
  return {
    ...p,
    components: p.components.map((c) => ({ ...c })),
  };
}

/** List all studio projects. Cached. */
export async function listProjects(): Promise<StudioProject[]> {
  return cacheWrap(
    PROJECTS_KEY,
    () => Promise.resolve(projects.map((p) => cloneProject(p))),
    CACHE_TTL.studioProjects,
  );
}

/** Get a single studio project by id. Cached. Throws 404 if missing. */
export async function getProjectById(id: string): Promise<StudioProject> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = projects.find((p) => p.id === id);
      if (!found) throw AppError.notFound(`Studio project '${id}' not found`);
      return Promise.resolve(cloneProject(found));
    },
    CACHE_TTL.studioProjectDetail,
  );
}

/** Create a new studio project. Invalidates list cache. */
export async function createProject(
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
  projects.push(project);
  invalidate(project.id);
  log.info("Studio project created", { id: project.id, name: project.name });
  return project;
}

/** Update an existing studio project (partial). Invalidates caches. */
export async function updateProject(
  id: string,
  input: UpdateStudioProjectInput,
): Promise<StudioProject> {
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw AppError.notFound(`Studio project '${id}' not found`);

  const current = projects[idx]!;
  const updated: StudioProject = {
    ...current,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.components !== undefined && { components: input.components }),
    updatedAt: new Date().toISOString(),
  };
  projects[idx] = updated;
  invalidate(id);
  log.info("Studio project updated", { id: updated.id });
  return updated;
}

/** Delete a studio project by id. Invalidates caches. */
export async function deleteProject(id: string): Promise<void> {
  const before = projects.length;
  projects = projects.filter((p) => p.id !== id);
  if (projects.length === before) {
    throw AppError.notFound(`Studio project '${id}' not found`);
  }
  invalidate(id);
  log.info("Studio project deleted", { id });
}

/** List all studio starter templates. Cached. */
export async function listTemplates(): Promise<StudioTemplate[]> {
  return cacheWrap(
    TEMPLATES_KEY,
    () => Promise.resolve(SEED_TEMPLATES.map((t) => ({ ...t }))),
    CACHE_TTL.studioTemplates,
  );
}

/** Number of projects in the store. */
export function projectsCount(): number {
  return projects.length;
}

/** Test-only: reset to seed. */
export function _resetStudioForTest(): void {
  projects = SEED_PROJECTS.map((p) => ({ ...p }));
  invalidate();
}
