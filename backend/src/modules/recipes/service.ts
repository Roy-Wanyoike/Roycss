/**
 * Recipes service — business logic for the recipes module.
 *
 * Recipes are curated combinations of effects for common UI patterns.
 * Source: src/lib/roycss-recipes.ts in the parent project. We keep a
 * snapshot here so the backend is self-contained — the parent project
 * can rebuild without redeploying the backend.
 *
 * Future: move recipes into a Prisma `Recipe` model and manage via
 * an admin endpoint.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import type { Recipe } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import { ListRecipesQuerySchema } from "./schema.js";
import type { z } from "zod";

// ─── Recipe snapshot ─────────────────────────────────────────────────────
const RECIPES: Recipe[] = [
  {
    id: "hero-animated-gradient",
    name: "Animated Gradient Hero",
    category: "hero-sections",
    description:
      "A modern hero section with animated gradient text, glassmorphism card, and glow button.",
    tags: ["hero", "landing", "gradient", "glass", "cta"],
    difficulty: "beginner",
    effectIds: ["text-gradient", "card-glassmorphism", "pulse-glow"],
    html: `<section class="hero">
  <h1 class="roycss-text-gradient">Build Beautiful UIs</h1>
  <p class="hero-subtitle">Production-ready CSS effects. Zero JavaScript.</p>
  <div class="roycss-card-glassmorphism hero-card">
    <p>Glass card content</p>
  </div>
  <button class="roycss-pulse-glow hero-cta">Get Started</button>
</section>`,
  },
  {
    id: "loading-skeleton-card",
    name: "Skeleton Loading Card",
    category: "loading-states",
    description: "A skeleton placeholder card for loading states with shimmer effect.",
    tags: ["loading", "skeleton", "shimmer", "card"],
    difficulty: "beginner",
    effectIds: ["loader-shimmer", "card-glassmorphism"],
    html: `<div class="roycss-card-glassmorphism skeleton-card">
  <div class="roycss-loader-shimmer skeleton-line"></div>
  <div class="roycss-loader-shimmer skeleton-line"></div>
  <div class="roycss-loader-shimmer skeleton-line short"></div>
</div>`,
  },
  {
    id: "notification-toast-stack",
    name: "Notification Toast Stack",
    category: "notifications",
    description: "A stack of toast notifications with slide-in animation.",
    tags: ["notification", "toast", "slide", "stack"],
    difficulty: "intermediate",
    effectIds: ["fade-in-up", "slide-in-right"],
    html: `<div class="toast-stack">
  <div class="roycss-slide-in-right toast">Saved</div>
  <div class="roycss-slide-in-right toast">New message</div>
</div>`,
  },
  {
    id: "glass-form-login",
    name: "Glass Login Form",
    category: "forms",
    description: "A glassmorphism login form with floating labels and focus glow.",
    tags: ["form", "login", "glass", "input"],
    difficulty: "intermediate",
    effectIds: ["card-glassmorphism", "input-glow-focus", "pulse-glow"],
    html: `<form class="roycss-card-glassmorphism login-form">
  <input class="roycss-input-glow-focus" placeholder="Email" />
  <input class="roycss-input-glow-focus" type="password" placeholder="Password" />
  <button class="roycss-pulse-glow">Sign In</button>
</form>`,
  },
  {
    id: "empty-state-cta",
    name: "Empty State with CTA",
    category: "empty-states",
    description: "A calming empty state with a breathing orb and a clear call-to-action.",
    tags: ["empty", "state", "cta", "orb"],
    difficulty: "beginner",
    effectIds: ["anim-breathing-orb-b18", "pulse-glow"],
    html: `<div class="empty-state">
  <div class="roycss-anim-breathing-orb-b18"></div>
  <h3>Nothing here yet</h3>
  <button class="roycss-pulse-glow">Create Item</button>
</div>`,
  },
];

export type ListRecipesInput = z.infer<typeof ListRecipesQuerySchema>;

export interface RecipeListResult {
  items: Recipe[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** List recipes with optional filters. Cached. */
export async function listRecipes(input: ListRecipesInput): Promise<RecipeListResult> {
  return cacheWrap(
    `recipes:list:${JSON.stringify(input)}`,
    () => {
      let filtered = RECIPES;
      if (input.category) filtered = filtered.filter((r) => r.category === input.category);
      if (input.difficulty)
        filtered = filtered.filter((r) => r.difficulty === input.difficulty);
      if (input.tag) filtered = filtered.filter((r) => r.tags.includes(input.tag!));

      const page = input.page;
      const limit = input.limit;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      return Promise.resolve({
        items,
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      });
    },
    CACHE_TTL.recipesList,
  );
}

/** Get a single recipe by id. Cached. Throws 404 if missing. */
export async function getRecipeById(id: string): Promise<Recipe> {
  return cacheWrap(
    `recipe:${id}`,
    () => {
      const found = RECIPES.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`Recipe '${id}' not found`);
      return Promise.resolve(found);
    },
    CACHE_TTL.recipeDetail,
  );
}

/** Number of recipes in the dataset. */
export function recipesCount(): number {
  return RECIPES.length;
}
