import type { CSSEffect } from "./roycss-types";
import { effects } from "./roycss-effects";

/**
 * RoyCSS Recipes — curated combinations of effects for common UI patterns.
 *
 * Developers search for solutions, not utilities. Each recipe combines
 * existing RoyCSS effects into a real UI pattern with:
 * - HTML structure
 * - RoyCSS classes
 * - Which effects are used
 * - Installation instructions
 */

export interface Recipe {
  id: string;
  name: string;
  category: string;
  description: string;
  /** HTML code for the recipe */
  html: string;
  /** Effect IDs used in this recipe */
  effectIds: string[];
  /** Tags for searchability */
  tags: string[];
  /** Difficulty level */
  difficulty: "beginner" | "intermediate" | "advanced";
}

/* ═══════════════════════════════════════════════════════════════
   Helper: find effect by ID (fuzzy match fallback)
   ═══════════════════════════════════════════════════════════════ */

function findEffect(id: string): CSSEffect | undefined {
  return effects.find((e) => e.id === id) || effects.find((e) => e.id.includes(id));
}

/* ═══════════════════════════════════════════════════════════════
   Recipe Categories
   ═══════════════════════════════════════════════════════════════ */

export const recipeCategoryMeta: Record<string, { label: string; description: string }> = {
  "hero-sections": { label: "Hero Sections", description: "Landing page hero sections with animated text and CTAs" },
  "loading-states": { label: "Loading States", description: "Loaders, skeletons, and progress indicators" },
  "cards": { label: "Cards", description: "Product cards, feature cards, and content cards" },
  "navigation": { label: "Navigation", description: "Nav bars, tabs, breadcrumbs, and menus" },
  "forms": { label: "Forms", description: "Login forms, inputs, and validation feedback" },
  "notifications": { label: "Notifications", description: "Badges, alerts, and status indicators" },
  "empty-states": { label: "Empty States", description: "Empty, error, and success states" },
  "buttons": { label: "Buttons", description: "CTA buttons, icon buttons, and button groups" },
};

export const recipeCategoryOrder = [
  "hero-sections",
  "loading-states",
  "cards",
  "navigation",
  "forms",
  "notifications",
  "empty-states",
  "buttons",
];

/* ═══════════════════════════════════════════════════════════════
   Recipes (12 curated patterns)
   ═══════════════════════════════════════════════════════════════ */

export const recipes: Recipe[] = [
  /* ─── Hero Sections ─── */
  {
    id: "hero-animated-gradient",
    name: "Animated Gradient Hero",
    category: "hero-sections",
    description: "A modern hero section with animated gradient text, glassmorphism card, and glow button",
    tags: ["hero", "landing", "gradient", "glass", "cta"],
    difficulty: "beginner",
    effectIds: ["text-gradient", "card-glassmorphism", "pulse-glow"],
    html: `<section class="hero">
  <h1 class="roycss-text-gradient">Build Beautiful UIs</h1>
  <p class="hero-subtitle">Production-ready CSS effects. Zero JavaScript.</p>

  <div class="roycss-card-glassmorphism" style="max-width: 400px; margin: 2rem auto;">
    <h3>Get Started</h3>
    <p>Install RoyCSS and use any of 840+ effects instantly.</p>
    <button class="roycss-pulse-glow" style="padding: 0.75rem 2rem; border-radius: 0.5rem; background: oklch(0.6 0.2 162); color: white; border: none; cursor: pointer;">
      npm install roycss
    </button>
  </div>
</section>`,
  },
  {
    id: "hero-aurora-text",
    name: "Aurora Text Hero",
    category: "hero-sections",
    description: "Hero with flowing aurora gradient text and a shine sweep button",
    tags: ["hero", "aurora", "gradient", "shine", "cta"],
    difficulty: "intermediate",
    effectIds: ["text-aurora-gradient-b18", "btn-shine-sweep"],
    html: `<section class="hero">
  <h1 class="roycss-text-aurora-gradient-b18" style="font-size: 3rem; font-weight: bold;">
    Ship Delightful Interfaces
  </h1>
  <p style="color: oklch(0.7 0.02 250); margin: 1rem 0 2rem;">
    840+ CSS effects. Copy, paste, ship.
  </p>
  <button class="roycss-btn-shine-sweep" style="padding: 0.75rem 2rem; border-radius: 0.5rem; background: oklch(0.6 0.2 162); color: white; border: none; cursor: pointer; font-weight: 600;">
    Browse Effects
  </button>
</section>`,
  },

  /* ─── Loading States ─── */
  {
    id: "loading-triple-spinner",
    name: "Triple Spinner Loading",
    category: "loading-states",
    description: "Three different loading indicators displayed together for a loading screen",
    tags: ["loading", "spinner", "loader", "dots"],
    difficulty: "beginner",
    effectIds: ["loader-spinner", "loader-dots", "loader-bars"],
    html: `<div style="display: flex; gap: 2rem; align-items: center; justify-content: center; padding: 3rem;">
  <div class="roycss-loader-spinner"></div>
  <div class="roycss-loader-dots">
    <span></span><span></span><span></span>
  </div>
  <div class="roycss-loader-bars">
    <span></span><span></span><span></span><span></span><span></span>
  </div>
</div>`,
  },
  {
    id: "loading-ring-pulse",
    name: "Ring + Pulse Loader",
    category: "loading-states",
    description: "A spinning ring combined with a pulsing circle — modern loading indicator",
    tags: ["loading", "ring", "pulse", "spinner"],
    difficulty: "beginner",
    effectIds: ["loader-ring-spin", "anim-pulse-ring-expand-b18"],
    html: `<div style="display: flex; gap: 3rem; align-items: center; justify-content: center; padding: 3rem;">
  <div class="roycss-loader-ring-spin"></div>
  <div class="roycss-anim-pulse-ring-expand-b18"></div>
</div>`,
  },

  /* ─── Cards ─── */
  {
    id: "card-feature-grid",
    name: "Feature Card Grid",
    category: "cards",
    description: "A grid of feature cards with hover lift, glow, and glassmorphism",
    tags: ["card", "feature", "grid", "hover", "glass"],
    difficulty: "intermediate",
    effectIds: ["hover-lift-glow-b18", "card-glassmorphism", "glass-badge-pill-b18"],
    html: `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
  <div class="roycss-hover-lift-glow-b18">
    <div class="roycss-card-glassmorphism" style="padding: 1.5rem;">
      <span class="roycss-glass-badge-pill-b18">New</span>
      <h3 style="margin: 0.5rem 0;">Fast</h3>
      <p style="font-size: 0.875rem; color: oklch(0.6 0.02 250);">Zero JavaScript runtime.</p>
    </div>
  </div>
  <div class="roycss-hover-lift-glow-b18">
    <div class="roycss-card-glassmorphism" style="padding: 1.5rem;">
      <span class="roycss-glass-badge-pill-b18">Modern</span>
      <h3 style="margin: 0.5rem 0;">OKLCH</h3>
      <p style="font-size: 0.875rem; color: oklch(0.6 0.02 250);">Future-proof color system.</p>
    </div>
  </div>
</div>`,
  },
  {
    id: "card-glass-hover",
    name: "Glass Hover Card",
    category: "cards",
    description: "A glassmorphism card that lifts and glows on hover — premium product card",
    tags: ["card", "glass", "hover", "premium", "product"],
    difficulty: "beginner",
    effectIds: ["card-glass-hover", "vis-frosted-glass-v2-b18"],
    html: `<div class="roycss-card-glass-hover" style="inline-size: 280px; padding: 1.5rem;">
  <div class="roycss-vis-frosted-glass-v2-b18" style="inline-size: 48px; block-size: 48px; border-radius: 0.75rem; margin-bottom: 1rem;"></div>
  <h3 style="margin: 0 0 0.5rem;">Premium Plan</h3>
  <p style="font-size: 0.875rem; color: oklch(0.6 0.02 250); margin: 0 0 1rem;">
    Everything you need to build beautiful interfaces.
  </p>
  <button style="padding: 0.5rem 1.5rem; border-radius: 0.5rem; background: oklch(0.6 0.2 162); color: white; border: none; cursor: pointer; font-weight: 600;">
    Choose Plan
  </button>
</div>`,
  },

  /* ─── Navigation ─── */
  {
    id: "nav-glass-bar",
    name: "Glass Navigation Bar",
    category: "navigation",
    description: "A floating glassmorphism navigation bar with badge pills and a glass button",
    tags: ["nav", "navigation", "glass", "bar", "floating"],
    difficulty: "intermediate",
    effectIds: ["glass-nav-bar-b18", "glass-badge-pill-b18", "btn-glass-press-b18"],
    html: `<nav class="roycss-glass-nav-bar-b18" style="display: flex; align-items: center; justify-content: space-between; padding: 0 1rem;">
  <span class="roycss-glass-badge-pill-b18">RoyCSS</span>
  <div style="display: flex; gap: 0.5rem;">
    <span class="roycss-glass-badge-pill-b18">Docs</span>
    <span class="roycss-glass-badge-pill-b18">Effects</span>
    <button class="roycss-btn-glass-press-b18">Get Started</button>
  </div>
</nav>`,
  },

  /* ─── Forms ─── */
  {
    id: "form-login-glass",
    name: "Glass Login Form",
    category: "forms",
    description: "A glassmorphism login form with frosted inputs and a gradient glow button",
    tags: ["form", "login", "glass", "input", "button"],
    difficulty: "intermediate",
    effectIds: ["card-glassmorphism", "glass-input-field-b18", "btn-gradient-glow-b18"],
    html: `<form class="roycss-card-glassmorphism" style="max-width: 320px; padding: 2rem; display: flex; flex-direction: column; gap: 1rem;">
  <h3 style="margin: 0; text-align: center;">Sign In</h3>
  <input class="roycss-glass-input-field-b18" type="email" placeholder="Email" style="inline-size: 100%;" />
  <input class="roycss-glass-input-field-b18" type="password" placeholder="Password" style="inline-size: 100%;" />
  <button class="roycss-btn-gradient-glow-b18" type="submit" style="inline-size: 100%;">Sign In</button>
</form>`,
  },

  /* ─── Notifications ─── */
  {
    id: "notification-pulse-badge",
    name: "Pulsing Notification Badge",
    category: "notifications",
    description: "A pulsing notification indicator with expanding rings — draws attention",
    tags: ["notification", "badge", "pulse", "attention", "alert"],
    difficulty: "beginner",
    effectIds: ["anim-pulse-ring-expand-b18", "micro-bell-shake-b18"],
    html: `<div style="position: relative; inline-size: 48px; block-size: 48px; display: flex; align-items: center; justify-content: center;">
  <span class="roycss-anim-pulse-ring-expand-b18"></span>
  <span class="roycss-micro-bell-shake-b18" style="font-size: 24px;">🔔</span>
</div>`,
  },
  {
    id: "notification-toast-glass",
    name: "Glass Toast Notification",
    category: "notifications",
    description: "A glassmorphism toast notification with a badge and message — slide-in ready",
    tags: ["notification", "toast", "glass", "badge", "alert"],
    difficulty: "intermediate",
    effectIds: ["card-glassmorphism", "glass-badge-pill-b18", "micro-fade-up"],
    html: `<div class="roycss-card-glassmorphism roycss-micro-fade-up" style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; max-width: 360px;">
  <span class="roycss-glass-badge-pill-b18">Success</span>
  <p style="margin: 0; font-size: 0.875rem;">Your changes have been saved.</p>
</div>`,
  },

  /* ─── Empty States ─── */
  {
    id: "empty-state-glow",
    name: "Glowing Empty State",
    category: "empty-states",
    description: "An empty state with a breathing orb and subtle text — zen-like placeholder",
    tags: ["empty", "state", "placeholder", "breathing", "calm"],
    difficulty: "beginner",
    effectIds: ["anim-breathing-orb-b18"],
    html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: 1rem;">
  <div class="roycss-anim-breathing-orb-b18"></div>
  <h3 style="margin: 0; color: oklch(0.7 0.02 250);">Nothing here yet</h3>
  <p style="margin: 0; font-size: 0.875rem; color: oklch(0.5 0.02 250);">Create your first item to get started.</p>
  <button style="padding: 0.5rem 1.5rem; border-radius: 0.5rem; background: oklch(0.6 0.2 162); color: white; border: none; cursor: pointer; font-weight: 600;">
    Create Item
  </button>
</div>`,
  },

  /* ─── Buttons ─── */
  {
    id: "buttons-cta-group",
    name: "CTA Button Group",
    category: "buttons",
    description: "A group of CTA buttons with different styles — gradient glow, 3D push, and glass",
    tags: ["button", "cta", "group", "gradient", "3d", "glass"],
    difficulty: "beginner",
    effectIds: ["btn-gradient-glow-b18", "btn-3d-push-b18", "btn-glass-press-b18"],
    html: `<div style="display: flex; gap: 1rem; align-items: center; justify-content: center; padding: 2rem;">
  <button class="roycss-btn-gradient-glow-b18">Primary</button>
  <button class="roycss-btn-3d-push-b18">Action</button>
  <button class="roycss-btn-glass-press-b18">Secondary</button>
</div>`,
  },
];

/* ═══════════════════════════════════════════════════════════════
   Helper: get full recipe with effect CSS code
   ═══════════════════════════════════════════════════════════════ */

export function getRecipeWithEffects(recipeId: string) {
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) return null;

  const effectDetails = recipe.effectIds
    .map((id) => {
      const effect = findEffect(id);
      if (!effect) return null;
      return {
        id: effect.id,
        name: effect.name,
        cssCode: effect.cssCode,
      };
    })
    .filter(Boolean);

  return {
    ...recipe,
    effects: effectDetails,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Helper: search recipes
   ═══════════════════════════════════════════════════════════════ */

export function searchRecipes(query: string, category?: string) {
  const q = query.toLowerCase().trim();
  let results = recipes;

  if (category) {
    results = results.filter((r) => r.category === category);
  }

  if (q) {
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.category.includes(q),
    );
  }

  return results;
}
