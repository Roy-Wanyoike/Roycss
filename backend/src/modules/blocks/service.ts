/**
 * Blocks service — Roy Blocks (application-level blocks).
 *
 * Mock backend (no DB). Seeds 10 application blocks across industry
 * categories (Auth, Billing, CRM, Healthcare, Analytics, Admin, Team,
 * Notifications, Onboarding, Dashboard). Create requests append a new
 * block to the store.
 *
 * Reads are LRU-cached; create mutates state and invalidates the list.
 *
 * Future: persist via Prisma `Block` model and gate submissions behind
 * an admin moderation queue.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { Block, BlockCategory } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { BlockCreateInput } from "./schema.js";

const log = createLogger("blocks");

const BLOCKS_KEY = "blocks:list";
const CATEGORIES_KEY = "blocks:categories";
const blockKey = (id: string): string => `block:${id}`;

function invalidate(id?: string): void {
  cache.delete(BLOCKS_KEY);
  cache.delete(CATEGORIES_KEY);
  if (id) cache.delete(blockKey(id));
}

function blk(
  id: string,
  name: string,
  category: string,
  industry: string,
  description: string,
  components: string[],
  tags: string[],
): Block {
  return {
    id,
    name,
    category,
    industry,
    description,
    components,
    tags,
    author: "roycss",
    version: "1.0.0",
    downloads: 0,
    rating: 0,
    updatedAt: "2025-02-01T00:00:00.000Z",
  };
}

// ─── Seed: 10 application blocks ────────────────────────────────────────
const SEED_BLOCKS: Block[] = [
  blk("block-auth", "Auth", "authentication", "general", "Login, signup, MFA, password reset, and session management.", ["LoginForm", "SignupForm", "MfaChallenge", "PasswordReset"], ["auth", "session", "mfa"]),
  blk("block-billing", "Billing", "commerce", "general", "Subscription billing, invoicing, tax, and dunning flows.", ["PlanCard", "InvoiceList", "TaxCalculator", "DunningBanner"], ["billing", "subscription", "invoice"]),
  blk("block-crm", "CRM", "productivity", "general", "Contacts, deals, pipeline, and activity timeline.", ["ContactCard", "DealKanban", "PipelineBoard", "ActivityFeed"], ["crm", "contacts", "pipeline"]),
  blk("block-healthcare", "Healthcare", "healthcare", "healthcare", "Patient records, scheduling, and HIPAA-ready messaging.", ["PatientCard", "AppointmentList", "ClinicalNotes", "SecureMessage"], ["healthcare", "hipaa", "patient"]),
  blk("block-analytics", "Analytics", "data", "general", "Dashboards, funnels, retention cohorts, and event tracking.", ["MetricCard", "FunnelChart", "CohortGrid", "EventTable"], ["analytics", "dashboard", "funnel"]),
  blk("block-admin", "Admin", "admin", "general", "User management, roles, audit log, and feature flags.", ["UserTable", "RoleEditor", "AuditLog", "FlagToggle"], ["admin", "rbac", "audit"]),
  blk("block-team", "Team", "productivity", "general", "Team directory, presence, invites, and permissions.", ["TeamDirectory", "PresenceList", "InviteForm", "PermissionMatrix"], ["team", "directory", "presence"]),
  blk("block-notifications", "Notifications", "communication", "general", "Inbox, toasts, digest preferences, and channels.", ["InboxList", "ToastStack", "DigestSettings", "ChannelPicker"], ["notifications", "inbox", "toasts"]),
  blk("block-onboarding", "Onboarding", "growth", "general", "Multi-step onboarding, checklists, and progress nudges.", ["StepWizard", "ChecklistCard", "ProgressNudge", "WelcomeHero"], ["onboarding", "wizard", "growth"]),
  blk("block-dashboard", "Dashboard", "data", "general", "Configurable dashboard shell with widget grid and filters.", ["DashboardShell", "WidgetGrid", "FilterBar", "WidgetCard"], ["dashboard", "widgets", "grid"]),
];

const SEED_CATEGORIES: BlockCategory[] = [
  { id: "cat-authentication", name: "Authentication", count: 1, icon: "lock" },
  { id: "cat-commerce", name: "Commerce", count: 1, icon: "credit-card" },
  { id: "cat-productivity", name: "Productivity", count: 2, icon: "users" },
  { id: "cat-healthcare", name: "Healthcare", count: 1, icon: "heart-pulse" },
  { id: "cat-data", name: "Data", count: 2, icon: "bar-chart" },
  { id: "cat-admin", name: "Admin", count: 1, icon: "shield" },
  { id: "cat-communication", name: "Communication", count: 1, icon: "bell" },
  { id: "cat-growth", name: "Growth", count: 1, icon: "trending-up" },
];

let blocks: Block[] = SEED_BLOCKS.map((b) => ({
  ...b,
  components: [...b.components],
  tags: [...b.tags],
}));

/** List all blocks. Cached. */
export async function listBlocks(): Promise<Block[]> {
  return cacheWrap(
    BLOCKS_KEY,
    () =>
      Promise.resolve(
        blocks.map((b) => ({
          ...b,
          components: [...b.components],
          tags: [...b.tags],
        })),
      ),
    CACHE_TTL.blocksList,
  );
}

/** Get a single block by id. Throws 404 if missing. */
export async function getBlockById(id: string): Promise<Block> {
  return cacheWrap(
    blockKey(id),
    () => {
      const found = blocks.find((b) => b.id === id);
      if (!found) throw AppError.notFound(`Block '${id}' not found`);
      return Promise.resolve({
        ...found,
        components: [...found.components],
        tags: [...found.tags],
      });
    },
    CACHE_TTL.blockDetail,
  );
}

/** List all block categories. Cached. */
export async function listBlockCategories(): Promise<BlockCategory[]> {
  return cacheWrap(
    CATEGORIES_KEY,
    () => Promise.resolve(SEED_CATEGORIES.map((c) => ({ ...c }))),
    CACHE_TTL.blockCategories,
  );
}

/** Create a new block (community submission). */
export async function createBlock(
  input: BlockCreateInput,
): Promise<Block> {
  const block: Block = {
    id: `block-${randomUUID()}`,
    name: input.name,
    category: input.category,
    industry: input.industry ?? "general",
    description: input.description,
    components: input.components ?? [],
    tags: input.tags ?? [],
    author: input.author ?? "community",
    version: "0.1.0",
    downloads: 0,
    rating: 0,
    updatedAt: new Date().toISOString(),
  };
  blocks = [block, ...blocks];
  invalidate(block.id);
  log.info("Block created", { id: block.id, name: block.name });
  return block;
}

/** Test-only: reset to seed. */
export function _resetBlocksForTest(): void {
  blocks = SEED_BLOCKS.map((b) => ({
    ...b,
    components: [...b.components],
    tags: [...b.tags],
  }));
  invalidate();
}
