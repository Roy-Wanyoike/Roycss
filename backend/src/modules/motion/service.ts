/**
 * Motion service — in-memory Roy Motion library catalog.
 *
 * Stores 20 mock motion effects across 6 categories (entrance, exit, loop,
 * scroll, hover, gesture) plus 8 named animation presets. All reads are
 * LRU-cached.
 *
 * No mutation endpoints — the motion library is a curated catalog.
 * Future: source effects from a JSON build step (like effects.json).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { MotionEffect } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("motion");

const LIST_KEY = "motion:effects";
const detailKey = (id: string): string => `motion:effect:${id}`;
const PRESETS_KEY = "motion:presets";
const CATEGORIES_KEY = "motion:categories";

// ─── Seed: 20 motion effects ─────────────────────────────────────────────
function eff(
  id: string,
  name: string,
  category: MotionEffect["category"],
  duration: number,
  easing: string,
  keyframes: string,
  cssCode: string,
): MotionEffect {
  return { id, name, category, duration, easing, keyframes, cssCode };
}

const SEED_EFFECTS: MotionEffect[] = [
  eff("motion-fade-in", "Fade In", "entrance", 300, "ease-out",
    "0%{opacity:0}100%{opacity:1}",
    "@keyframes motion-fade-in{0%{opacity:0}100%{opacity:1}}.motion-fade-in{animation:motion-fade-in .3s ease-out}"),
  eff("motion-fade-in-up", "Fade In Up", "entrance", 400, "cubic-bezier(0.16,1,0.3,1)",
    "0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}",
    "@keyframes motion-fade-in-up{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}.motion-fade-in-up{animation:motion-fade-in-up .4s cubic-bezier(0.16,1,0.3,1)}"),
  eff("motion-scale-in", "Scale In", "entrance", 250, "cubic-bezier(0.34,1.56,0.64,1)",
    "0%{opacity:0;transform:scale(.9)}100%{opacity:1;transform:scale(1)}",
    "@keyframes motion-scale-in{0%{opacity:0;transform:scale(.9)}100%{opacity:1;transform:scale(1)}}.motion-scale-in{animation:motion-scale-in .25s cubic-bezier(0.34,1.56,0.64,1)}"),
  eff("motion-slide-in-right", "Slide In Right", "entrance", 350, "ease-out",
    "0%{opacity:0;transform:translateX(40px)}100%{opacity:1;transform:translateX(0)}",
    "@keyframes motion-slide-in-right{0%{opacity:0;transform:translateX(40px)}100%{opacity:1;transform:translateX(0)}}.motion-slide-in-right{animation:motion-slide-in-right .35s ease-out}"),
  eff("motion-blur-in", "Blur In", "entrance", 500, "ease-out",
    "0%{opacity:0;filter:blur(12px)}100%{opacity:1;filter:blur(0)}",
    "@keyframes motion-blur-in{0%{opacity:0;filter:blur(12px)}100%{opacity:1;filter:blur(0)}}.motion-blur-in{animation:motion-blur-in .5s ease-out}"),
  eff("motion-fade-out", "Fade Out", "exit", 250, "ease-in",
    "0%{opacity:1}100%{opacity:0}",
    "@keyframes motion-fade-out{0%{opacity:1}100%{opacity:0}}.motion-fade-out{animation:motion-fade-out .25s ease-in}"),
  eff("motion-scale-out", "Scale Out", "exit", 200, "ease-in",
    "0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}",
    "@keyframes motion-scale-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}.motion-scale-out{animation:motion-scale-out .2s ease-in}"),
  eff("motion-slide-out-up", "Slide Out Up", "exit", 300, "ease-in",
    "0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-20px)}",
    "@keyframes motion-slide-out-up{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-20px)}}.motion-slide-out-up{animation:motion-slide-out-up .3s ease-in}"),
  eff("motion-pulse", "Pulse", "loop", 1500, "ease-in-out",
    "0%,100%{opacity:1}50%{opacity:.5}",
    "@keyframes motion-pulse{0%,100%{opacity:1}50%{opacity:.5}}.motion-pulse{animation:motion-pulse 1.5s ease-in-out infinite}"),
  eff("motion-spin", "Spin", "loop", 1000, "linear",
    "0%{transform:rotate(0)}100%{transform:rotate(360deg)}",
    "@keyframes motion-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}.motion-spin{animation:motion-spin 1s linear infinite}"),
  eff("motion-bounce", "Bounce", "loop", 1200, "cubic-bezier(0.28,0.84,0.42,1)",
    "0%,100%{transform:translateY(0)}50%{transform:translateY(-25%)}",
    "@keyframes motion-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-25%)}}.motion-bounce{animation:motion-bounce 1.2s cubic-bezier(0.28,0.84,0.42,1) infinite}"),
  eff("motion-shimmer", "Shimmer", "loop", 2000, "linear",
    "0%{background-position:-200% 0}100%{background-position:200% 0}",
    "@keyframes motion-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.motion-shimmer{background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.2) 50%,transparent 100%);background-size:200% 100%;animation:motion-shimmer 2s linear infinite}"),
  eff("motion-float", "Float", "loop", 3000, "ease-in-out",
    "0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}",
    "@keyframes motion-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}.motion-float{animation:motion-float 3s ease-in-out infinite}"),
  eff("motion-parallax-y", "Parallax Y", "scroll", 0, "linear",
    "0%{transform:translateY(0)}100%{transform:translateY(-100px)}",
    ".motion-parallax-y{animation:parallax-y linear;animation-timeline:scroll()}"),
  eff("motion-reveal-up", "Reveal Up", "scroll", 0, "cubic-bezier(0.16,1,0.3,1)",
    "0%{opacity:0;transform:translateY(60px)}100%{opacity:1;transform:translateY(0)}",
    ".motion-reveal-up{animation:reveal-up linear both;animation-timeline:view();animation-range:entry 0% cover 30%}"),
  eff("motion-sticky-fade", "Sticky Fade", "scroll", 0, "ease-out",
    "0%{opacity:0}100%{opacity:1}",
    ".motion-sticky-fade{animation:sticky-fade linear both;animation-timeline:scroll()}"),
  eff("motion-hover-lift", "Hover Lift", "hover", 200, "ease-out",
    "0%{transform:translateY(0)}100%{transform:translateY(-4px)}",
    ".motion-hover-lift{transition:transform .2s ease-out}.motion-hover-lift:hover{transform:translateY(-4px)}"),
  eff("motion-hover-glow", "Hover Glow", "hover", 250, "ease-out",
    "0%{box-shadow:0 0 0 rgba(16,185,129,0)}100%{box-shadow:0 0 24px rgba(16,185,129,.5)}",
    ".motion-hover-glow{transition:box-shadow .25s ease-out}.motion-hover-glow:hover{box-shadow:0 0 24px rgba(16,185,129,.5)}"),
  eff("motion-tap-shrink", "Tap Shrink", "gesture", 100, "ease-out",
    "0%{transform:scale(1)}100%{transform:scale(.95)}",
    ".motion-tap-shrink:active{transform:scale(.95);transition:transform .1s ease-out}"),
  eff("motion-drag-wobble", "Drag Wobble", "gesture", 400, "cubic-bezier(0.36,0.07,0.19,0.97)",
    "0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}",
    "@keyframes motion-drag-wobble{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}.motion-drag-wobble{animation:motion-drag-wobble .4s cubic-bezier(0.36,0.07,0.19,0.97)}"),
];

// ─── Seed: animation presets (named combinations) ────────────────────────
const SEED_PRESETS: { name: string; effects: string[]; description: string }[] = [
  { name: "Page Enter", effects: ["motion-fade-in-up", "motion-blur-in"], description: "Staggered page entrance." },
  { name: "Card Reveal", effects: ["motion-scale-in", "motion-hover-lift"], description: "Card scales in, lifts on hover." },
  { name: "Loading Loop", effects: ["motion-spin", "motion-pulse"], description: "Dual-loop loading state." },
  { name: "Toast Slide", effects: ["motion-slide-in-right", "motion-slide-out-up"], description: "Toast enters right, exits up." },
  { name: "Button Press", effects: ["motion-tap-shrink", "motion-hover-glow"], description: "Tap-to-shrink, hover-to-glow button." },
  { name: "Scroll Story", effects: ["motion-reveal-up", "motion-parallax-y"], description: "Scroll-driven story sequence." },
  { name: "Drag Feedback", effects: ["motion-drag-wobble", "motion-hover-lift"], description: "Wobble while dragging, lift on hover." },
  { name: "Empty State", effects: ["motion-fade-in", "motion-float"], description: "Gentle fade-in with floating element." },
];

/** List all motion effects. Cached. */
export async function listEffects(): Promise<MotionEffect[]> {
  return cacheWrap(
    LIST_KEY,
    () => Promise.resolve(SEED_EFFECTS.map((e) => ({ ...e }))),
    CACHE_TTL.motionEffects,
  );
}

/** Get a single motion effect by id. Cached. Throws 404 if missing. */
export async function getEffectById(id: string): Promise<MotionEffect> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = SEED_EFFECTS.find((e) => e.id === id);
      if (!found) throw AppError.notFound(`Motion effect '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.motionEffectDetail,
  );
}

/** List all animation presets. Cached. */
export async function listPresets(): Promise<
  { name: string; effects: string[]; description: string }[]
> {
  return cacheWrap(
    PRESETS_KEY,
    () => Promise.resolve(SEED_PRESETS.map((p) => ({ ...p }))),
    CACHE_TTL.motionPresets,
  );
}

/** List all motion categories with effect counts. Cached. */
export async function listCategories(): Promise<
  { category: MotionEffect["category"]; count: number }[]
> {
  return cacheWrap(
    CATEGORIES_KEY,
    () => {
      const byCategory = new Map<MotionEffect["category"], number>();
      for (const e of SEED_EFFECTS) {
        byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
      }
      const ordered: MotionEffect["category"][] = [
        "entrance",
        "exit",
        "loop",
        "scroll",
        "hover",
        "gesture",
      ];
      return Promise.resolve(
        ordered
          .filter((c) => byCategory.has(c))
          .map((c) => ({ category: c, count: byCategory.get(c) ?? 0 })),
      );
    },
    CACHE_TTL.motionCategories,
  );
}

/** Number of motion effects in the catalog. */
export function motionCount(): number {
  return SEED_EFFECTS.length;
}

log.debug("Motion module loaded", { effects: SEED_EFFECTS.length });
