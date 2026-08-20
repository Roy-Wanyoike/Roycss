/**
 * Workspace service — Prisma-backed Roy Workspace resources + team store.
 *
 * Persisted via the Prisma `WorkspaceResource` model. Seeds 4 resource
 * types (Templates, Tokens, Components, Projects), each with 4–6 items,
 * on first access. Team members remain a static in-memory seed (no
 * Prisma model).
 *
 * Field-mapping: the Prisma `WorkspaceResource` model exposes (userId,
 * type, name, contentJson). Each seed item is persisted as one row;
 * `type ← resource type`, `name ← item.name`; the wrapper for the extra
 * fields (label, description, itemUpdatedAt) is JSON-encoded inside
 * `contentJson`. `count` is computed from the persisted items at read
 * time (no separate column).
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  WorkspaceResourceType,
  WorkspaceTeamMember,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("workspace");

const RESOURCES_KEY = "workspace:resources";
const resourceTypeKey = (type: string): string => `workspace:resources:${type}`;
const TEAM_KEY = "workspace:team";

function invalidateTeam(): void {
  cache.delete(TEAM_KEY);
}

// ─── Seed: 4 resource types with 4–6 items each ──────────────────────────
const SEED_RESOURCES: WorkspaceResourceType[] = [
  {
    type: "templates",
    label: "Templates",
    count: 5,
    items: [
      {
        id: "tpl-landing",
        name: "SaaS Landing Page",
        description: "Hero + features + pricing + CTA.",
        updatedAt: "2025-02-26T10:00:00.000Z",
      },
      {
        id: "tpl-docs",
        name: "Docs Site",
        description: "Sidebar + content + on-this-page.",
        updatedAt: "2025-02-25T08:00:00.000Z",
      },
      {
        id: "tpl-dashboard",
        name: "Analytics Dashboard",
        description: "Grid layout with KPI cards and charts.",
        updatedAt: "2025-02-24T17:00:00.000Z",
      },
      {
        id: "tpl-portfolio",
        name: "Developer Portfolio",
        description: "Single-page portfolio with project grid.",
        updatedAt: "2025-02-22T09:00:00.000Z",
      },
      {
        id: "tpl-blog",
        name: "Engineering Blog",
        description: "Post list + post detail + RSS.",
        updatedAt: "2025-02-20T14:00:00.000Z",
      },
    ],
  },
  {
    type: "tokens",
    label: "Design Tokens",
    count: 4,
    items: [
      {
        id: "tok-default",
        name: "Default Palette",
        description: "Primary, secondary, accent, neutrals.",
        updatedAt: "2025-02-26T10:00:00.000Z",
      },
      {
        id: "tok-dark",
        name: "Dark Mode Tokens",
        description: "Dark-mode palette mapped to default tokens.",
        updatedAt: "2025-02-25T08:00:00.000Z",
      },
      {
        id: "tok-spacing",
        name: "Spacing Scale",
        description: "4px base scale with named steps (xs, sm, md, lg, xl).",
        updatedAt: "2025-02-24T17:00:00.000Z",
      },
      {
        id: "tok-typography",
        name: "Typography Scale",
        description: "Fluid type scale with 6 heading levels + body.",
        updatedAt: "2025-02-22T09:00:00.000Z",
      },
    ],
  },
  {
    type: "components",
    label: "Components",
    count: 6,
    items: [
      {
        id: "cmp-button",
        name: "Button",
        description: "Variants: primary, secondary, ghost, outline.",
        updatedAt: "2025-02-26T10:00:00.000Z",
      },
      {
        id: "cmp-card",
        name: "Card",
        description: "Composable card with header, body, footer slots.",
        updatedAt: "2025-02-25T08:00:00.000Z",
      },
      {
        id: "cmp-input",
        name: "Input",
        description: "Text input with label, hint, and error states.",
        updatedAt: "2025-02-24T17:00:00.000Z",
      },
      {
        id: "cmp-modal",
        name: "Modal",
        description: "Accessible modal with focus trap and ESC to close.",
        updatedAt: "2025-02-22T09:00:00.000Z",
      },
      {
        id: "cmp-tabs",
        name: "Tabs",
        description: "Tabs with keyboard nav (arrow keys, Home/End).",
        updatedAt: "2025-02-20T14:00:00.000Z",
      },
      {
        id: "cmp-toast",
        name: "Toast",
        description: "Toast notifications with auto-dismiss.",
        updatedAt: "2025-02-18T11:00:00.000Z",
      },
    ],
  },
  {
    type: "projects",
    label: "Projects",
    count: 4,
    items: [
      {
        id: "prj-marketing",
        name: "Marketing Site",
        description: "Public marketing site for RoyCSS.",
        updatedAt: "2025-02-26T10:00:00.000Z",
      },
      {
        id: "prj-docs",
        name: "Docs Portal",
        description: "Documentation portal with versioned content.",
        updatedAt: "2025-02-25T08:00:00.000Z",
      },
      {
        id: "prj-dashboard",
        name: "Internal Dashboard",
        description: "Internal analytics dashboard.",
        updatedAt: "2025-02-24T17:00:00.000Z",
      },
      {
        id: "prj-blog",
        name: "Engineering Blog",
        description: "Engineering blog with MDX posts.",
        updatedAt: "2025-02-22T09:00:00.000Z",
      },
    ],
  },
];

// ─── Seed: 4 team members (static — no Prisma model) ───────────────────
const SEED_TEAM: WorkspaceTeamMember[] = [
  {
    id: "user-1",
    name: "Roy Chen",
    email: "roy@roycss.dev",
    role: "owner",
    avatar: "https://avatars.roycss.dev/roy.png",
    lastActive: "2025-02-28T11:00:00.000Z",
  },
  {
    id: "user-2",
    name: "Maya Singh",
    email: "maya@roycss.dev",
    role: "admin",
    avatar: "https://avatars.roycss.dev/maya.png",
    lastActive: "2025-02-27T16:00:00.000Z",
  },
  {
    id: "user-3",
    name: "Leo Park",
    email: "leo@roycss.dev",
    role: "editor",
    avatar: "https://avatars.roycss.dev/leo.png",
    lastActive: "2025-02-26T09:00:00.000Z",
  },
  {
    id: "user-4",
    name: "Ana Costa",
    email: "ana@roycss.dev",
    role: "viewer",
    avatar: "https://avatars.roycss.dev/ana.png",
    lastActive: "2025-02-25T13:00:00.000Z",
  },
];

let team: WorkspaceTeamMember[] = SEED_TEAM.map((m) => ({ ...m }));

interface ResourceWrapper {
  label: string;
  description: string;
  itemUpdatedAt: string;
}

function itemsToDbRows(type: WorkspaceResourceType) {
  return type.items.map((item) => {
    const wrapper: ResourceWrapper = {
      label: type.label,
      description: item.description,
      itemUpdatedAt: item.updatedAt,
    };
    return {
      id: item.id,
      userId: null,
      type: type.type,
      name: item.name,
      contentJson: JSON.stringify(wrapper),
    };
  });
}

function rowsToType(
  type: string,
  rows: Array<{
    id: string;
    name: string;
    type: string;
    contentJson: string;
    updatedAt: Date;
  }>,
): WorkspaceResourceType | null {
  if (rows.length === 0) return null;
  let label = type;
  const items = rows.map((row) => {
    let wrapper: ResourceWrapper = {
      label,
      description: "",
      itemUpdatedAt: row.updatedAt.toISOString(),
    };
    try {
      wrapper = JSON.parse(row.contentJson) as ResourceWrapper;
      if (wrapper.label) label = wrapper.label;
    } catch {
      // Keep defaults.
    }
    return {
      id: row.id,
      name: row.name,
      description: wrapper.description,
      updatedAt: wrapper.itemUpdatedAt,
    };
  });
  return {
    type,
    label,
    count: items.length,
    items,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.workspaceResource.count();
    if (count === 0) {
      const rows = SEED_RESOURCES.flatMap(itemsToDbRows);
      await db.workspaceResource.createMany({ data: rows });
      log.info("Workspace resources seeded", { rows: rows.length });
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all workspace resource types (with their items). Cached. */
export async function listResources(): Promise<WorkspaceResourceType[]> {
  return cacheWrap(
    RESOURCES_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.workspaceResource.findMany({
        orderBy: { createdAt: "asc" },
      });
      const byType = new Map<string, typeof rows>();
      for (const r of rows) {
        const arr = byType.get(r.type) ?? [];
        arr.push(r);
        byType.set(r.type, arr);
      }
      // Preserve the seed order of types (templates, tokens, components, projects).
      const types = SEED_RESOURCES.map((r) => r.type);
      // Append any new types (e.g. added via a future create) at the end.
      for (const t of byType.keys()) {
        if (!types.includes(t)) types.push(t);
      }
      return types
        .map((t) => rowsToType(t, byType.get(t) ?? []))
        .filter((r): r is WorkspaceResourceType => r !== null);
    },
    CACHE_TTL.workspaceResources,
  );
}

/** List items for one resource type. Cached. Throws 404 if missing. */
export async function listResourcesByType(
  type: string,
): Promise<WorkspaceResourceType> {
  return cacheWrap(
    resourceTypeKey(type),
    async () => {
      await seedIfEmpty();
      const rows = await db.workspaceResource.findMany({
        where: { type },
        orderBy: { createdAt: "asc" },
      });
      const result = rowsToType(type, rows);
      if (!result) {
        throw AppError.notFound(`Resource type '${type}' not found`);
      }
      return result;
    },
    CACHE_TTL.workspaceResourceType,
  );
}

/** List workspace team members. Cached. */
export async function listTeam(): Promise<WorkspaceTeamMember[]> {
  return cacheWrap(
    TEAM_KEY,
    () => Promise.resolve(team.map((m) => ({ ...m }))),
    CACHE_TTL.workspaceTeam,
  );
}

/** Invite a new team member. Invalidates team cache. */
export async function inviteMember(input: {
  email: string;
  name?: string;
  role?: WorkspaceTeamMember["role"];
}): Promise<WorkspaceTeamMember> {
  // Reject duplicates by email.
  if (team.some((m) => m.email.toLowerCase() === input.email.toLowerCase())) {
    throw AppError.conflict(
      `Team member with email '${input.email}' already exists`,
    );
  }
  const member: WorkspaceTeamMember = {
    id: `user-${randomUUID()}`,
    name: input.name ?? input.email.split("@")[0] ?? "Member",
    email: input.email,
    role: input.role ?? "viewer",
    avatar: `https://avatars.roycss.dev/${input.email.split("@")[0]}.png`,
    lastActive: new Date().toISOString(),
  };
  team.push(member);
  invalidateTeam();
  log.info("Team member invited", { id: member.id, email: member.email });
  return member;
}

/** Number of team members in the store. */
export function teamCount(): number {
  return team.length;
}

/** Test-only: reset to seed. */
export function _resetWorkspaceForTest(): void {
  seedPromise = null;
  team = SEED_TEAM.map((m) => ({ ...m }));
  invalidateTeam();
}

log.debug("Workspace module loaded", {
  resourceTypes: SEED_RESOURCES.length,
  team: SEED_TEAM.length,
});
