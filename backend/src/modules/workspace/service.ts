/**
 * Workspace service — in-memory Roy Workspace resources + team store.
 *
 * Mock backend (no DB). Seeds 4 resource types (Templates, Tokens,
 * Components, Projects), each with 4–6 items, plus 4 team members.
 * All reads are LRU-cached; inviting a team member invalidates the team
 * cache.
 *
 * Future: swap the in-memory arrays for a Prisma `WorkspaceResource` /
 * `WorkspaceTeamMember` model backed by the workspace microservice.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
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

// ─── Seed: 4 team members ────────────────────────────────────────────────
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

/** List all workspace resource types (with their items). Cached. */
export async function listResources(): Promise<WorkspaceResourceType[]> {
  return cacheWrap(
    RESOURCES_KEY,
    () =>
      Promise.resolve(
        SEED_RESOURCES.map((r) => ({
          ...r,
          items: r.items.map((i) => ({ ...i })),
        })),
      ),
    CACHE_TTL.workspaceResources,
  );
}

/** List items for one resource type. Cached. Throws 404 if missing. */
export async function listResourcesByType(
  type: string,
): Promise<WorkspaceResourceType> {
  return cacheWrap(
    resourceTypeKey(type),
    () => {
      const found = SEED_RESOURCES.find((r) => r.type === type);
      if (!found) {
        throw AppError.notFound(`Resource type '${type}' not found`);
      }
      return Promise.resolve({
        ...found,
        items: found.items.map((i) => ({ ...i })),
      });
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
  team = SEED_TEAM.map((m) => ({ ...m }));
  invalidateTeam();
}

log.debug("Workspace module loaded", {
  resourceTypes: SEED_RESOURCES.length,
  team: SEED_TEAM.length,
});
