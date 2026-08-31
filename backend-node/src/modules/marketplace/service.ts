/**
 * Marketplace service — Prisma-backed template store.
 *
 * Persisted via the `Template` + `TemplateReview` Prisma models. Seeds
 * 12 platform templates and 5 starter reviews on first access.
 *
 * Field-mapping: the Prisma `Template` model exposes (slug, name,
 * description, authorId, category, htmlCode, cssCode, jsCode, downloads).
 * The domain shape's `id ← slug`, `name`, `description`, `category`,
 * `downloads` map directly; `authorId ← author`; the extra fields
 * (price, rating, features, thumbnail) are JSON-encoded inside
 * `htmlCode` as a wrapper. The Prisma `TemplateReview` model exposes
 * (templateId, userId, rating, comment). The domain shape's
 * `templateId`, `rating` map directly; `userId ← author`; `comment`
 * is JSON-encoded as a wrapper that also stores the original comment.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL, PAGINATION } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { Paginated, Template, TemplateReview } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ListTemplatesQuerySchema, PublishTemplateInput } from "./schema.js";
import type { z } from "zod";

const log = createLogger("marketplace");

export type ListTemplatesInput = z.infer<typeof ListTemplatesQuerySchema>;

const listKey = (input: ListTemplatesInput): string =>
  `templates:list:${JSON.stringify(input)}`;
const detailKey = (id: string): string => `template:${id}`;
const reviewsKey = (id: string): string => `template:${id}:reviews`;

function invalidateList(): void {
  // We don't know every list variant, so iterate the known cache key
  // family by clearing any cached list key matching the prefix is not
  // directly supported by LRUCache. As an acceptable tradeoff we
  // invalidate the most common cache key (default query) and rely on
  // TTL for the rest. Since the dataset is small this is fine.
  cache.delete(listKey({
    page: 1,
    limit: PAGINATION.defaultLimit,
  }));
}

// ─── Seed: 12 templates ──────────────────────────────────────────────────
const SEED_TEMPLATES: Template[] = [
  {
    id: "tpl-healthcare-dashboard",
    name: "Healthcare Dashboard",
    category: "dashboard",
    price: 49,
    author: "RoyCSS Studio",
    downloads: 1240,
    rating: 4.8,
    description: "HIPAA-ready healthcare dashboard with patient cards, vitals charts, and appointment calendar.",
    features: ["Patient roster", "Vitals charts", "Appointment calendar", "Dark mode", "AAA contrast"],
    thumbnail: "https://cdn.roycss.dev/templates/healthcare-dashboard.png",
    createdAt: "2025-01-05T00:00:00.000Z",
  },
  {
    id: "tpl-saas-landing",
    name: "SaaS Landing",
    category: "landing",
    price: 39,
    author: "Mira Lin",
    downloads: 3120,
    rating: 4.9,
    description: "Conversion-optimized SaaS landing page with hero, feature grid, pricing, and testimonials.",
    features: ["Animated hero", "Feature grid", "Pricing table", "Testimonials", "Newsletter CTA"],
    thumbnail: "https://cdn.roycss.dev/templates/saas-landing.png",
    createdAt: "2025-01-07T00:00:00.000Z",
  },
  {
    id: "tpl-admin-panel",
    name: "Admin Panel",
    category: "admin",
    price: 59,
    author: "RoyCSS Studio",
    downloads: 2870,
    rating: 4.7,
    description: "Full admin panel with sidebar nav, data tables, filters, and CRUD modals.",
    features: ["Sidebar nav", "Data tables", "Filters", "CRUD modals", "Role badges"],
    thumbnail: "https://cdn.roycss.dev/templates/admin-panel.png",
    createdAt: "2025-01-09T00:00:00.000Z",
  },
  {
    id: "tpl-crm",
    name: "CRM",
    category: "crm",
    price: 69,
    author: "Devon Cross",
    downloads: 1840,
    rating: 4.6,
    description: "Sales CRM with pipeline board, contact records, activity timeline, and deal cards.",
    features: ["Pipeline kanban", "Contact records", "Activity timeline", "Deal cards"],
    thumbnail: "https://cdn.roycss.dev/templates/crm.png",
    createdAt: "2025-01-11T00:00:00.000Z",
  },
  {
    id: "tpl-pos",
    name: "POS",
    category: "pos",
    price: 79,
    author: "Mira Lin",
    downloads: 960,
    rating: 4.5,
    description: "Point-of-sale interface with product grid, cart, payment pad, and receipt preview.",
    features: ["Product grid", "Cart", "Payment pad", "Receipt preview", "Offline-ready"],
    thumbnail: "https://cdn.roycss.dev/templates/pos.png",
    createdAt: "2025-01-13T00:00:00.000Z",
  },
  {
    id: "tpl-banking",
    name: "Banking",
    category: "banking",
    price: 89,
    author: "RoyCSS Studio",
    downloads: 1420,
    rating: 4.8,
    description: "Retail banking portal with account summary, transactions, transfers, and statements.",
    features: ["Account summary", "Transaction list", "Transfers", "Statements", "2FA ready"],
    thumbnail: "https://cdn.roycss.dev/templates/banking.png",
    createdAt: "2025-01-15T00:00:00.000Z",
  },
  {
    id: "tpl-portfolio",
    name: "Portfolio",
    category: "portfolio",
    price: 0,
    author: "Asha Roy",
    downloads: 5210,
    rating: 4.9,
    description: "Designer portfolio with project gallery, case studies, about, and contact sections.",
    features: ["Project gallery", "Case studies", "About", "Contact form", "Free"],
    thumbnail: "https://cdn.roycss.dev/templates/portfolio.png",
    createdAt: "2025-01-17T00:00:00.000Z",
  },
  {
    id: "tpl-ecommerce",
    name: "E-commerce",
    category: "ecommerce",
    price: 99,
    author: "Devon Cross",
    downloads: 2680,
    rating: 4.7,
    description: "Online store with product grid, filters, cart drawer, checkout, and order history.",
    features: ["Product grid", "Filters", "Cart drawer", "Checkout", "Order history"],
    thumbnail: "https://cdn.roycss.dev/templates/ecommerce.png",
    createdAt: "2025-01-19T00:00:00.000Z",
  },
  {
    id: "tpl-blog",
    name: "Blog",
    category: "blog",
    price: 0,
    author: "Asha Roy",
    downloads: 4180,
    rating: 4.8,
    description: "Minimal blog with featured post, article list, categories, tags, and reading progress.",
    features: ["Featured post", "Article list", "Categories", "Tags", "Reading progress", "Free"],
    thumbnail: "https://cdn.roycss.dev/templates/blog.png",
    createdAt: "2025-01-21T00:00:00.000Z",
  },
  {
    id: "tpl-documentation",
    name: "Documentation",
    category: "documentation",
    price: 29,
    author: "RoyCSS Studio",
    downloads: 1980,
    rating: 4.6,
    description: "Documentation site with sidebar TOC, search, code blocks, and API reference layout.",
    features: ["Sidebar TOC", "Search", "Code blocks", "API reference", "Dark mode"],
    thumbnail: "https://cdn.roycss.dev/templates/documentation.png",
    createdAt: "2025-01-23T00:00:00.000Z",
  },
  {
    id: "tpl-pricing",
    name: "Pricing",
    category: "pricing",
    price: 19,
    author: "Mira Lin",
    downloads: 3640,
    rating: 4.9,
    description: "Pricing page with monthly/yearly toggle, three tiers, FAQ, and comparison table.",
    features: ["Billing toggle", "Three tiers", "FAQ", "Comparison table", "Animated CTA"],
    thumbnail: "https://cdn.roycss.dev/templates/pricing.png",
    createdAt: "2025-01-25T00:00:00.000Z",
  },
  {
    id: "tpl-auth",
    name: "Auth",
    category: "auth",
    price: 0,
    author: "RoyCSS Studio",
    downloads: 6120,
    rating: 4.9,
    description: "Authentication screens — login, register, forgot password, and 2FA verification.",
    features: ["Login", "Register", "Forgot password", "2FA", "Social login", "Free"],
    thumbnail: "https://cdn.roycss.dev/templates/auth.png",
    createdAt: "2025-01-27T00:00:00.000Z",
  },
];

// ─── Seed: a few starter reviews ─────────────────────────────────────────
const SEED_REVIEWS: TemplateReview[] = [
  {
    id: "rev-1",
    templateId: "tpl-healthcare-dashboard",
    author: "Priya N.",
    rating: 5,
    comment: "Saved us a week of work. AAA contrast out of the box was huge for our audit.",
    createdAt: "2025-02-01T00:00:00.000Z",
  },
  {
    id: "rev-2",
    templateId: "tpl-healthcare-dashboard",
    author: "Marcus T.",
    rating: 4,
    comment: "Solid foundation. Needed to tweak the appointment calendar for our timezone.",
    createdAt: "2025-02-04T00:00:00.000Z",
  },
  {
    id: "rev-3",
    templateId: "tpl-saas-landing",
    author: "Lena V.",
    rating: 5,
    comment: "Conversion went up 18% after switching to this hero. Worth every penny.",
    createdAt: "2025-02-06T00:00:00.000Z",
  },
  {
    id: "rev-4",
    templateId: "tpl-portfolio",
    author: "Sami K.",
    rating: 5,
    comment: "Free and gorgeous. Got three freelance leads the week I shipped it.",
    createdAt: "2025-02-08T00:00:00.000Z",
  },
  {
    id: "rev-5",
    templateId: "tpl-admin-panel",
    author: "Dana O.",
    rating: 4,
    comment: "CRUD modals are great. Would love a dark variant out of the box.",
    createdAt: "2025-02-10T00:00:00.000Z",
  },
];

interface TemplateWrapper {
  price: number;
  rating: number;
  features: string[];
  thumbnail: string;
  createdAt: string;
}

interface ReviewWrapper {
  author: string;
  comment: string;
}

function templateToDb(t: Template) {
  const wrapper: TemplateWrapper = {
    price: t.price,
    rating: t.rating,
    features: t.features,
    thumbnail: t.thumbnail,
    createdAt: t.createdAt,
  };
  return {
    id: t.id,
    slug: t.id,
    name: t.name,
    description: t.description,
    authorId: t.author,
    category: t.category,
    htmlCode: JSON.stringify(wrapper),
    cssCode: null,
    jsCode: null,
    downloads: t.downloads,
  };
}

function templateToDomain(row: {
  id: string;
  name: string;
  description: string;
  authorId: string | null;
  category: string;
  htmlCode: string;
  downloads: number;
  createdAt: Date;
}): Template {
  let wrapper: TemplateWrapper = {
    price: 0,
    rating: 0,
    features: [],
    thumbnail: "",
    createdAt: row.createdAt.toISOString(),
  };
  try {
    wrapper = JSON.parse(row.htmlCode) as TemplateWrapper;
  } catch {
    // Keep defaults.
  }
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: wrapper.price,
    author: row.authorId ?? "",
    downloads: row.downloads,
    rating: wrapper.rating,
    description: row.description,
    features: wrapper.features,
    thumbnail: wrapper.thumbnail,
    createdAt: wrapper.createdAt,
  };
}

function reviewToDb(r: TemplateReview) {
  const wrapper: ReviewWrapper = { author: r.author, comment: r.comment };
  return {
    id: r.id,
    templateId: r.templateId,
    userId: r.author,
    rating: r.rating,
    comment: JSON.stringify(wrapper),
  };
}

function reviewToDomain(row: {
  id: string;
  templateId: string;
  userId: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
}): TemplateReview {
  let wrapper: ReviewWrapper = { author: row.userId ?? "", comment: "" };
  if (row.comment) {
    try {
      wrapper = JSON.parse(row.comment) as ReviewWrapper;
    } catch {
      // Keep defaults.
    }
  }
  return {
    id: row.id,
    templateId: row.templateId,
    author: wrapper.author,
    rating: row.rating,
    comment: wrapper.comment,
    createdAt: row.createdAt.toISOString(),
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    if ((await db.template.count()) === 0) {
      await db.template.createMany({
        data: SEED_TEMPLATES.map(templateToDb),
      });
    }
    if ((await db.templateReview.count()) === 0) {
      await db.templateReview.createMany({
        data: SEED_REVIEWS.map(reviewToDb),
      });
    }
    log.info("Marketplace seeded", {
      templates: SEED_TEMPLATES.length,
      reviews: SEED_REVIEWS.length,
    });
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

// ─── Service functions ───────────────────────────────────────────────────

/** List templates with filters + search. Cached. */
export async function listTemplates(
  input: ListTemplatesInput,
): Promise<Paginated<Template>> {
  return cacheWrap(
    listKey(input),
    async () => {
      await seedIfEmpty();
      const rows = await db.template.findMany({
        orderBy: { createdAt: "asc" },
      });
      let filtered = rows.map(templateToDomain);

      if (input.category) {
        filtered = filtered.filter((t) => t.category === input.category);
      }
      if (input.minRating !== undefined) {
        filtered = filtered.filter((t) => t.rating >= input.minRating!);
      }
      if (input.free !== undefined) {
        filtered = filtered.filter(
          (t) => (t.price === 0) === input.free,
        );
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        const terms = q.split(/\s+/).filter(Boolean);
        filtered = filtered.filter((t) => {
          const haystack = (
            t.name + " " + t.description + " " + t.category + " " + t.author + " " + t.features.join(" ")
          ).toLowerCase();
          return terms.every((term) => haystack.includes(term));
        });
      }

      // Sort by downloads desc as a stable relevance signal.
      const sorted = [...filtered].sort((a, b) => b.downloads - a.downloads);

      const safeLimit = Math.min(
        Math.max(input.limit, 1),
        PAGINATION.maxLimit,
      );
      const safePage = Math.max(input.page, 1);
      const start = (safePage - 1) * safeLimit;
      const items = sorted.slice(start, start + safeLimit);

      return {
        items,
        page: safePage,
        limit: safeLimit,
        total: sorted.length,
        totalPages: Math.max(1, Math.ceil(sorted.length / safeLimit)),
      };
    },
    CACHE_TTL.templatesList,
  );
}

/** Get a single template by id. Cached. Throws 404 if missing. */
export async function getTemplateById(id: string): Promise<Template> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.template.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Template '${id}' not found`);
      return templateToDomain(row);
    },
    CACHE_TTL.templateDetail,
  );
}

/** Publish a new template. Invalidates list cache. */
export async function publishTemplate(
  input: PublishTemplateInput,
): Promise<Template> {
  await seedIfEmpty();
  const template: Template = {
    id: `tpl-${randomUUID()}`,
    name: input.name,
    category: input.category,
    price: input.price,
    author: input.author,
    downloads: 0,
    rating: 0,
    description: input.description,
    features: input.features,
    thumbnail: input.thumbnail || "",
    createdAt: new Date().toISOString(),
  };
  await db.template.create({ data: templateToDb(template) });
  invalidateList();
  log.info("Template published", { id: template.id, name: template.name });
  return template;
}

/** Get reviews for a template. Cached. */
export async function getReviewsForTemplate(
  id: string,
): Promise<TemplateReview[]> {
  // Validate existence first (throws 404 if missing).
  await getTemplateById(id);

  return cacheWrap(
    reviewsKey(id),
    async () => {
      await seedIfEmpty();
      const rows = await db.templateReview.findMany({
        where: { templateId: id },
        orderBy: { createdAt: "asc" },
      });
      return rows.map(reviewToDomain);
    },
    CACHE_TTL.templateDetail,
  );
}

/** Number of templates in the store. Sync stub — real count is in DB. */
export function templatesCount(): number {
  return SEED_TEMPLATES.length;
}

/** Test-only: reset to seed. */
export function _resetTemplatesForTest(): void {
  seedPromise = null;
  invalidateList();
}
