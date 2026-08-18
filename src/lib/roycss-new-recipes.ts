/**
 * RoyCSS — New Curated Recipes (expansion pack)
 * ─────────────────────────────────────────────────────────────────
 * Six additional production-ready recipes that compose existing RoyCSS
 * effects into real, shippable UI patterns. Each recipe references
 * real effect IDs from the master effects library (see
 * `src/lib/roycss-effects.ts`) and ships with copy-paste HTML that
 * uses the `.roycss-*` class convention.
 *
 * These recipes are additive — they extend the original 12 recipes in
 * `roycss-recipes.ts` without modifying them. Total platform recipes:
 * 12 (original) + 6 (this file) = 18.
 */

import { effects } from "./roycss-effects";

/** A curated recipe that composes RoyCSS effects into a UI pattern. */
export interface NewRecipe {
  /** Unique slug identifier. */
  id: string;
  /** Human-friendly display name. */
  name: string;
  /** Short one-line description of what the recipe produces. */
  description: string;
  /** Searchable tags. */
  tags: string[];
  /** Real effect IDs from the effects library used by this recipe. */
  effects: string[];
  /** Copy-paste HTML template using `.roycss-*` classes. */
  html: string;
}

/* ═══════════════════════════════════════════════════════════════
   Development-time guard: warn (via build-time analysis only) if a
   referenced effect ID does not exist. This is a pure validation
   helper — it does not run in the component tree.
   ═══════════════════════════════════════════════════════════════ */

const VALID_EFFECT_IDS = new Set(effects.map((e) => e.id));

function assertEffectsExist(recipeId: string, ids: string[]): void {
  for (const id of ids) {
    if (!VALID_EFFECT_IDS.has(id)) {
      // Surface invalid references during development. Throwing keeps the
      // data layer honest — invalid recipes should never ship.
      throw new Error(
        `[roycss-new-recipes] Recipe "${recipeId}" references unknown effect "${id}".`,
      );
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   The 6 new recipes
   ═══════════════════════════════════════════════════════════════ */

export const newRecipes: NewRecipe[] = [
  /* ─── 1. SaaS Landing Hero ─── */
  {
    id: "saas-landing-hero",
    name: "SaaS Landing Hero",
    description:
      "A high-converting SaaS hero with an animated gradient headline, a glass feature card, and a glowing CTA button.",
    tags: ["hero", "saas", "landing", "gradient", "glass", "cta", "marketing"],
    effects: [
      "text-aurora-gradient-b18",
      "card-glassmorphism",
      "btn-gradient-glow-b18",
      "glass-badge-pill-b18",
      "btn-glass-press-b18",
    ],
    html: `<section class="saas-hero" style="position: relative; padding: 5rem 1.5rem; text-align: center; overflow: hidden;">
  <div style="max-width: 720px; margin: 0 auto;">
    <span class="roycss-glass-badge-pill-b18" style="margin-bottom: 1.5rem;">New · v2.0 ships today</span>
    <h1 class="roycss-text-aurora-gradient-b18" style="font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 800; line-height: 1.05; margin: 0 0 1.25rem;">
      Ship delightful products faster
    </h1>
    <p style="font-size: 1.125rem; color: oklch(0.7 0.02 250); max-width: 560px; margin: 0 auto 2rem;">
      The all-in-one platform for design, build, and deploy — with 1,749+ production-ready CSS effects baked in.
    </p>
    <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
      <button class="roycss-btn-gradient-glow-b18" style="padding: 0.85rem 2rem; font-weight: 600;">Start free trial</button>
      <button class="roycss-btn-glass-press-b18" style="padding: 0.85rem 2rem;">Watch demo</button>
    </div>
  </div>

  <div class="roycss-card-glassmorphism" style="max-width: 920px; margin: 3rem auto 0; padding: 1.5rem;">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; text-align: left;">
      <div>
        <h3 style="margin: 0 0 0.25rem; font-size: 1.5rem;">12k+</h3>
        <p style="margin: 0; font-size: 0.85rem; color: oklch(0.6 0.02 250);">Active teams</p>
      </div>
      <div>
        <h3 style="margin: 0 0 0.25rem; font-size: 1.5rem;">99.99%</h3>
        <p style="margin: 0; font-size: 0.85rem; color: oklch(0.6 0.02 250);">Uptime SLA</p>
      </div>
      <div>
        <h3 style="margin: 0 0 0.25rem; font-size: 1.5rem;">1,749</h3>
        <p style="margin: 0; font-size: 0.85rem; color: oklch(0.6 0.02 250);">CSS effects</p>
      </div>
    </div>
  </div>
</section>`,
  },

  /* ─── 2. Dashboard Sidebar ─── */
  {
    id: "dashboard-sidebar",
    name: "Dashboard Sidebar",
    description:
      "A collapsible app sidebar with nav items, an active-state indicator, and icon-led navigation.",
    tags: ["dashboard", "sidebar", "navigation", "nav", "app", "collapsible"],
    effects: ["hover-glow-border", "hover-scale", "slide-in-left"],
    html: `<aside class="dashboard-sidebar roycss-slide-in-left" style="inline-size: 240px; min-block-size: 100vh; background: oklch(0.18 0.01 250); border-inline-end: 1px solid oklch(0.3 0.02 250); padding: 1.25rem 0.75rem; box-sizing: border-box;">
  <div style="padding: 0 0.5rem 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
    <div style="inline-size: 28px; block-size: 28px; border-radius: 0.5rem; background: oklch(0.6 0.2 162);"></div>
    <span style="font-weight: 700; color: oklch(0.95 0.01 250);">Acme</span>
  </div>

  <nav style="display: flex; flex-direction: column; gap: 0.25rem;">
    <!-- Active item -->
    <a class="roycss-hover-glow-border" href="#" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: 0.5rem; background: oklch(0.6 0.2 162 / 0.15); color: oklch(0.85 0.15 162); border: 1px solid oklch(0.6 0.2 162 / 0.4); text-decoration: none; font-size: 0.9rem; font-weight: 600;">
      <span style="inline-size: 18px; text-align: center;">■</span>
      Dashboard
      <span style="margin-inline-start: auto; inline-size: 4px; block-size: 18px; border-radius: 2px; background: oklch(0.6 0.2 162);"></span>
    </a>

    <!-- Inactive items -->
    <a class="roycss-hover-scale" href="#" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: 0.5rem; color: oklch(0.7 0.02 250); text-decoration: none; font-size: 0.9rem;">
      <span style="inline-size: 18px; text-align: center;">◆</span>
      Analytics
    </a>
    <a class="roycss-hover-scale" href="#" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: 0.5rem; color: oklch(0.7 0.02 250); text-decoration: none; font-size: 0.9rem;">
      <span style="inline-size: 18px; text-align: center;">●</span>
      Customers
    </a>
    <a class="roycss-hover-scale" href="#" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: 0.5rem; color: oklch(0.7 0.02 250); text-decoration: none; font-size: 0.9rem;">
      <span style="inline-size: 18px; text-align: center;">▲</span>
      Revenue
    </a>
    <a class="roycss-hover-scale" href="#" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: 0.5rem; color: oklch(0.7 0.02 250); text-decoration: none; font-size: 0.9rem;">
      <span style="inline-size: 18px; text-align: center;">⚙</span>
      Settings
    </a>
  </nav>

  <div style="margin-block-start: auto; padding: 1rem 0.5rem 0;">
    <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem; border-radius: 0.5rem; background: oklch(0.25 0.01 250);">
      <div style="inline-size: 32px; block-size: 32px; border-radius: 50%; background: oklch(0.4 0.05 250);"></div>
      <div style="min-inline-size: 0;">
        <p style="margin: 0; font-size: 0.8rem; color: oklch(0.9 0.01 250); font-weight: 600;">Jane Doe</p>
        <p style="margin: 0; font-size: 0.7rem; color: oklch(0.6 0.02 250);">jane@acme.io</p>
      </div>
    </div>
  </div>
</aside>`,
  },

  /* ─── 3. Pricing Cards (3-tier, highlighted middle) ─── */
  {
    id: "pricing-cards",
    name: "Pricing Cards",
    description:
      "A three-tier pricing grid with a highlighted middle plan, hover lift, and a pulsing popular badge.",
    tags: ["pricing", "cards", "saas", "marketing", "tier", "plan"],
    effects: ["hover-lift-glow-b18", "hover-press", "hover-underline-slide", "pulse-glow"],
    html: `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; align-items: center; padding: 2rem 1rem; max-width: 960px; margin: 0 auto;">

  <!-- Starter -->
  <div class="roycss-hover-lift-glow-b18" style="padding: 2rem; border-radius: 1rem; border: 1px solid oklch(0.3 0.02 250); background: oklch(0.15 0.01 250);">
    <h3 style="margin: 0 0 0.5rem; font-size: 1.1rem; color: oklch(0.9 0.01 250);">Starter</h3>
    <p style="margin: 0 0 1.5rem; font-size: 0.85rem; color: oklch(0.6 0.02 250);">For side projects.</p>
    <p style="margin: 0 0 1.5rem;"><span style="font-size: 2.5rem; font-weight: 800; color: oklch(0.95 0.01 250);">$0</span><span style="color: oklch(0.6 0.02 250);">/mo</span></p>
    <ul style="list-style: none; padding: 0; margin: 0 0 1.5rem; font-size: 0.85rem; color: oklch(0.7 0.02 250); display: flex; flex-direction: column; gap: 0.5rem;">
      <li>✓ 3 projects</li>
      <li>✓ Community effects</li>
      <li>✓ Email support</li>
    </ul>
    <button class="roycss-hover-press" style="inline-size: 100%; padding: 0.7rem; border-radius: 0.5rem; background: oklch(0.25 0.01 250); color: oklch(0.9 0.01 250); border: 1px solid oklch(0.35 0.02 250); cursor: pointer; font-weight: 600;">Get started</button>
  </div>

  <!-- Pro (highlighted) -->
  <div class="roycss-hover-lift-glow-b18" style="position: relative; padding: 2.25rem 2rem; border-radius: 1rem; border: 2px solid oklch(0.6 0.2 162); background: oklch(0.18 0.02 162 / 0.1); box-shadow: 0 0 0 1px oklch(0.6 0.2 162 / 0.3), 0 20px 50px -20px oklch(0.6 0.2 162 / 0.4);">
    <span class="roycss-pulse-glow" style="position: absolute; inset-block-start: -0.75rem; inset-inline-start: 50%; transform: translateX(-50%); padding: 0.25rem 0.75rem; border-radius: 999px; background: oklch(0.6 0.2 162); color: white; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">Popular</span>
    <h3 style="margin: 0 0 0.5rem; font-size: 1.1rem; color: oklch(0.85 0.15 162);">Pro</h3>
    <p style="margin: 0 0 1.5rem; font-size: 0.85rem; color: oklch(0.6 0.02 250);">For growing teams.</p>
    <p style="margin: 0 0 1.5rem;"><span style="font-size: 2.5rem; font-weight: 800; color: oklch(0.95 0.01 250);">$29</span><span style="color: oklch(0.6 0.02 250);">/mo</span></p>
    <ul style="list-style: none; padding: 0; margin: 0 0 1.5rem; font-size: 0.85rem; color: oklch(0.75 0.02 250); display: flex; flex-direction: column; gap: 0.5rem;">
      <li>✓ Unlimited projects</li>
      <li>✓ All 1,749 effects</li>
      <li>✓ Priority support</li>
      <li>✓ Custom themes</li>
    </ul>
    <button class="roycss-hover-press" style="inline-size: 100%; padding: 0.7rem; border-radius: 0.5rem; background: oklch(0.6 0.2 162); color: white; border: none; cursor: pointer; font-weight: 700;">Start Pro trial</button>
  </div>

  <!-- Enterprise -->
  <div class="roycss-hover-lift-glow-b18" style="padding: 2rem; border-radius: 1rem; border: 1px solid oklch(0.3 0.02 250); background: oklch(0.15 0.01 250);">
    <h3 style="margin: 0 0 0.5rem; font-size: 1.1rem; color: oklch(0.9 0.01 250);">Enterprise</h3>
    <p style="margin: 0 0 1.5rem; font-size: 0.85rem; color: oklch(0.6 0.02 250);">For organizations.</p>
    <p style="margin: 0 0 1.5rem;"><span style="font-size: 2.5rem; font-weight: 800; color: oklch(0.95 0.01 250);">Custom</span></p>
    <ul style="list-style: none; padding: 0; margin: 0 0 1.5rem; font-size: 0.85rem; color: oklch(0.7 0.02 250); display: flex; flex-direction: column; gap: 0.5rem;">
      <li>✓ SSO &amp; SAML</li>
      <li>✓ Dedicated manager</li>
      <li>✓ 99.99% SLA</li>
    </ul>
    <a class="roycss-hover-underline-slide" href="#" style="display: inline-block; inline-size: 100%; text-align: center; padding: 0.7rem; border-radius: 0.5rem; background: oklch(0.25 0.01 250); color: oklch(0.9 0.01 250); border: 1px solid oklch(0.35 0.02 250); text-decoration: none; font-weight: 600;">Contact sales</a>
  </div>
</div>`,
  },

  /* ─── 4. Auth Form ─── */
  {
    id: "auth-form",
    name: "Auth Form",
    description:
      "A centered sign-in card with frosted glass inputs, a focus glow, and a gradient submit button.",
    tags: ["auth", "form", "login", "signin", "card", "input", "glass"],
    effects: ["glass-input-field-b18", "card-glassmorphism", "btn-gradient-glow-b18", "fade-in-up"],
    html: `<div class="roycss-fade-in-up" style="min-block-size: 100vh; display: grid; place-items: center; padding: 2rem 1rem;">
  <form class="roycss-card-glassmorphism" style="inline-size: 100%; max-inline-size: 380px; padding: 2.5rem 2rem; display: flex; flex-direction: column; gap: 1.1rem;">
    <div style="text-align: center; margin-block-end: 0.5rem;">
      <div style="inline-size: 44px; block-size: 44px; border-radius: 0.75rem; background: oklch(0.6 0.2 162); margin: 0 auto 0.75rem;"></div>
      <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: oklch(0.95 0.01 250);">Welcome back</h2>
      <p style="margin: 0.35rem 0 0; font-size: 0.85rem; color: oklch(0.6 0.02 250);">Sign in to your account</p>
    </div>

    <label style="display: flex; flex-direction: column; gap: 0.4rem;">
      <span style="font-size: 0.8rem; font-weight: 600; color: oklch(0.8 0.02 250);">Email</span>
      <input class="roycss-glass-input-field-b18" type="email" placeholder="you@example.com" style="inline-size: 100%; box-sizing: border-box;" />
    </label>

    <label style="display: flex; flex-direction: column; gap: 0.4rem;">
      <span style="font-size: 0.8rem; font-weight: 600; color: oklch(0.8 0.02 250);">Password</span>
      <input class="roycss-glass-input-field-b18" type="password" placeholder="••••••••" style="inline-size: 100%; box-sizing: border-box;" />
    </label>

    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem;">
      <label style="display: flex; align-items: center; gap: 0.4rem; color: oklch(0.7 0.02 250); cursor: pointer;">
        <input type="checkbox" /> Remember me
      </label>
      <a href="#" style="color: oklch(0.7 0.15 162); text-decoration: none;">Forgot password?</a>
    </div>

    <button class="roycss-btn-gradient-glow-b18" type="submit" style="inline-size: 100%; padding: 0.8rem; font-weight: 700;">Sign in</button>

    <p style="text-align: center; font-size: 0.8rem; color: oklch(0.6 0.02 250); margin: 0;">
      Don't have an account? <a href="#" style="color: oklch(0.7 0.15 162); text-decoration: none;">Sign up</a>
    </p>
  </form>
</div>`,
  },

  /* ─── 5. Notification Toast ─── */
  {
    id: "notification-toast",
    name: "Notification Toast",
    description:
      "A slide-in toast that auto-dismisses, with a status icon, message, and close button.",
    tags: ["notification", "toast", "alert", "feedback", "slide-in", "auto-dismiss"],
    effects: ["slide-in-right", "card-glassmorphism", "hover-press"],
    html: `<div role="status" aria-live="polite" style="position: fixed; inset-block-end: 1.5rem; inset-inline-end: 1.5rem; z-index: 50; max-inline-size: 360px;">
  <div class="roycss-slide-in-right roycss-card-glassmorphism" style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; border-inline-start: 3px solid oklch(0.7 0.15 162);">
    <div style="flex-shrink: 0; inline-size: 28px; block-size: 28px; border-radius: 50%; background: oklch(0.7 0.15 162 / 0.2); display: grid; place-items: center; color: oklch(0.8 0.15 162); font-weight: 700;">✓</div>
    <div style="flex: 1; min-inline-size: 0;">
      <p style="margin: 0; font-weight: 600; font-size: 0.9rem; color: oklch(0.95 0.01 250);">Saved successfully</p>
      <p style="margin: 0.2rem 0 0; font-size: 0.8rem; color: oklch(0.65 0.02 250);">Your changes have been published.</p>
      <div style="margin-block-start: 0.6rem; block-size: 3px; border-radius: 2px; background: oklch(0.3 0.02 250); overflow: hidden;">
        <div style="inline-size: 100%; block-size: 100%; background: oklch(0.7 0.15 162); animation: roycss-toast-progress 5s linear forwards;"></div>
      </div>
    </div>
    <button class="roycss-hover-press" aria-label="Dismiss notification" style="flex-shrink: 0; background: transparent; border: none; color: oklch(0.6 0.02 250); cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0 0.25rem;">×</button>
  </div>
</div>`,
  },

  /* ─── 6. Data Table ─── */
  {
    id: "data-table",
    name: "Data Table",
    description:
      "A striped, sticky-header data table with hover row highlight and an animated column underline.",
    tags: ["table", "data", "dashboard", "admin", "sticky-header", "striped"],
    effects: ["hover-glow-border", "hover-shadow-grow", "hover-underline-slide"],
    html: `<div style="border: 1px solid oklch(0.3 0.02 250); border-radius: 0.75rem; overflow: hidden; background: oklch(0.15 0.01 250);">
  <div style="overflow-x: auto;">
    <table style="inline-size: 100%; border-collapse: collapse; font-size: 0.875rem;">
      <thead>
        <tr style="position: sticky; inset-block-start: 0; background: oklch(0.2 0.01 250); z-index: 1;">
          <th style="text-align: start; padding: 0.85rem 1rem; color: oklch(0.65 0.02 250); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">User</th>
          <th class="roycss-hover-underline-slide" style="text-align: start; padding: 0.85rem 1rem; color: oklch(0.65 0.02 250); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer;">Role</th>
          <th style="text-align: start; padding: 0.85rem 1rem; color: oklch(0.65 0.02 250); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
          <th style="text-align: end; padding: 0.85rem 1rem; color: oklch(0.65 0.02 250); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Joined</th>
        </tr>
      </thead>
      <tbody>
        <tr class="roycss-hover-shadow-grow" style="background: oklch(0.16 0.01 250); cursor: pointer;">
          <td style="padding: 0.85rem 1rem; color: oklch(0.9 0.01 250); font-weight: 500;">Jane Cooper</td>
          <td style="padding: 0.85rem 1rem; color: oklch(0.7 0.02 250);">Admin</td>
          <td style="padding: 0.85rem 1rem;"><span style="padding: 0.15rem 0.6rem; border-radius: 999px; background: oklch(0.7 0.15 162 / 0.15); color: oklch(0.8 0.15 162); font-size: 0.72rem; font-weight: 600;">Active</span></td>
          <td style="padding: 0.85rem 1rem; text-align: end; color: oklch(0.6 0.02 250);">Jan 12, 2025</td>
        </tr>
        <tr class="roycss-hover-shadow-grow" style="background: oklch(0.13 0.01 250); cursor: pointer;">
          <td style="padding: 0.85rem 1rem; color: oklch(0.9 0.01 250); font-weight: 500;">Wade Wilson</td>
          <td style="padding: 0.85rem 1rem; color: oklch(0.7 0.02 250);">Editor</td>
          <td style="padding: 0.85rem 1rem;"><span style="padding: 0.15rem 0.6rem; border-radius: 999px; background: oklch(0.75 0.15 75 / 0.15); color: oklch(0.85 0.15 75); font-size: 0.72rem; font-weight: 600;">Pending</span></td>
          <td style="padding: 0.85rem 1rem; text-align: end; color: oklch(0.6 0.02 250);">Feb 03, 2025</td>
        </tr>
        <tr class="roycss-hover-shadow-grow" style="background: oklch(0.16 0.01 250); cursor: pointer;">
          <td style="padding: 0.85rem 1rem; color: oklch(0.9 0.01 250); font-weight: 500;">Esther Howard</td>
          <td style="padding: 0.85rem 1rem; color: oklch(0.7 0.02 250);">Viewer</td>
          <td style="padding: 0.85rem 1rem;"><span style="padding: 0.15rem 0.6rem; border-radius: 999px; background: oklch(0.7 0.15 162 / 0.15); color: oklch(0.8 0.15 162); font-size: 0.72rem; font-weight: 600;">Active</span></td>
          <td style="padding: 0.85rem 1rem; text-align: end; color: oklch(0.6 0.02 250);">Mar 21, 2025</td>
        </tr>
        <tr class="roycss-hover-glow-border roycss-hover-shadow-grow" style="background: oklch(0.13 0.01 250); cursor: pointer;">
          <td style="padding: 0.85rem 1rem; color: oklch(0.9 0.01 250); font-weight: 500;">Cameron Williamson</td>
          <td style="padding: 0.85rem 1rem; color: oklch(0.7 0.02 250);">Admin</td>
          <td style="padding: 0.85rem 1rem;"><span style="padding: 0.15rem 0.6rem; border-radius: 999px; background: oklch(0.65 0.2 25 / 0.15); color: oklch(0.75 0.2 25); font-size: 0.72rem; font-weight: 600;">Inactive</span></td>
          <td style="padding: 0.85rem 1rem; text-align: end; color: oklch(0.6 0.02 250);">Apr 09, 2025</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`,
  },
];

/* ═══════════════════════════════════════════════════════════════
   Runtime validation — runs once on module load so invalid effect
   references surface immediately during dev / build.
   ═══════════════════════════════════════════════════════════════ */
for (const recipe of newRecipes) {
  assertEffectsExist(recipe.id, recipe.effects);
}

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

/** Look up a recipe by id. */
export function getNewRecipe(id: string): NewRecipe | undefined {
  return newRecipes.find((r) => r.id === id);
}

/** Filter new recipes by a free-text query (matches name, description, tags). */
export function searchNewRecipes(query: string): NewRecipe[] {
  const q = query.toLowerCase().trim();
  if (!q) return newRecipes;
  return newRecipes.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

/** Total number of effect references across all new recipes (with dedupe). */
export function getUniqueEffectCount(): number {
  const set = new Set<string>();
  for (const r of newRecipes) for (const id of r.effects) set.add(id);
  return set.size;
}
