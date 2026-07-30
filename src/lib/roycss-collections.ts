import type { CSSEffect } from "./roycss-types";
import { effects } from "./roycss-effects";

/**
 * RoyCSS Collections — curated themed bundles of effects.
 *
 * With 1569 effects, discoverability is a challenge. Collections solve this
 * by hand-picking the best effects for specific aesthetics, use cases, or
 * design languages. Each collection tells you WHAT to use and WHY.
 */

export interface Collection {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Visual theme color (OKLCH) for the collection card accent */
  accent: string;
  /** Emoji or short icon label for quick recognition */
  icon: string;
  /** Difficulty: how hard to combine these effects cohesively */
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  /** Effect IDs that belong to this collection (all must exist in the effects array) */
  effectIds: string[];
  /** Tags for searchability */
  tags: string[];
  /** When to use this collection */
  whenToUse: string;
}

export const collections: Collection[] = [
  {
    id: "apple-material",
    name: "Apple Material Design",
    tagline: "Frosted glass, elastic springs, and squishy transitions",
    description:
      "Recreate the premium feel of macOS, iOS, and visionOS. Frosted glass surfaces, elastic spring animations, and subtle depth — the hallmarks of Apple's design language since Big Sur.",
    accent: "oklch(0.7 0.08 250)",
    icon: "",
    difficulty: "Intermediate",
    effectIds: [
      "bounce-in",
      "rubber-band",
      "jack-in-box",
      "card-glassmorphism",
      "card-hover-press",
      "btn-ripple",
      "form-label-float",
      "form-success-check",
      "form-toggle-switch",
      "misc-ripple-click",
      "pulse-soft",
      "hover-shadow-grow",
    ],
    tags: ["apple", "material", "glass", "spring", "elastic", "premium", "macos", "ios"],
    whenToUse:
      "SaaS dashboards, productivity apps, premium product pages, and any interface that should feel expensive and polished.",
  },
  {
    id: "neon-cyberpunk",
    name: "Neon Cyberpunk",
    tagline: "Electric glows, glitch text, and dark-mode drama",
    description:
      "Channel Blade Runner, Cyberpunk 2077, and Neo-Tokyo aesthetics. Neon glow effects, glitch distortions, VHS scanlines, and electric borders — built for dark interfaces that demand attention.",
    accent: "oklch(0.7 0.25 330)",
    icon: "",
    difficulty: "Intermediate",
    effectIds: [
      "pulse-glow",
      "text-neon-glow",
      "text-glitch",
      "btn-neon",
      "btn-glow",
      "card-neon",
      "hover-neon-flicker",
      "border-animated-dash",
      "border-neon-pulse",
      "filter-glitch",
      "visual-glitch-distort",
      "misc-vhs-effect",
    ],
    tags: ["neon", "cyberpunk", "glitch", "dark", "electric", "futuristic", "glow"],
    whenToUse:
      "Gaming interfaces, crypto/web3 apps, music platforms, developer tools, and any brand targeting a tech-savvy audience.",
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism Pro",
    tagline: "Frosted panels, depth layering, and translucent surfaces",
    description:
      "The glassmorphism trend done right. Frosted glass cards, acrylic surfaces, liquid blur, and transparent overlays — with proper contrast and accessibility baked in.",
    accent: "oklch(0.75 0.1 200)",
    icon: "",
    difficulty: "Beginner",
    effectIds: [
      "card-glassmorphism",
      "glass-frosted",
      "glass-acrylic",
      "glass-liquid",
      "glass-transparent-blur",
      "glass-frosted-dark",
      "hover-zoom-blur",
      "text-blur-reveal",
      "blur-in",
      "filter-blur-focus",
      "card-glass-hover",
      "glass-nav-bar-b18",
    ],
    tags: ["glass", "glassmorphism", "frosted", "blur", "translucent", "acrylic", "depth"],
    whenToUse:
      "Hero sections, dashboard cards, modals, navigation bars, and any UI layering that needs depth without heavy shadows.",
  },
  {
    id: "minimal-clean",
    name: "Minimal & Clean",
    tagline: "Subtle fades, gentle hovers, and quiet confidence",
    description:
      "Sometimes less is more. These effects are barely noticeable individually but create a cohesive, professional feel together. Perfect for corporate sites, portfolios, and content-heavy platforms.",
    accent: "oklch(0.6 0.05 160)",
    icon: "",
    difficulty: "Beginner",
    effectIds: [
      "fade-in-up",
      "pulse-soft",
      "hover-scale",
      "hover-underline-slide",
      "hover-shadow-grow",
      "hover-push-up",
      "float",
      "slide-in-left",
      "slide-in-right",
      "zoom-in",
      "scroll-reveal-up",
      "breathe",
    ],
    tags: ["minimal", "clean", "subtle", "professional", "corporate", "quiet", "elegant"],
    whenToUse:
      "Corporate websites, portfolios, blogs, documentation sites, and any project where the content should shine, not the effects.",
  },
  {
    id: "playful-fun",
    name: "Playful & Fun",
    tagline: "Bounces, wobbles, and celebratory springs",
    description:
      "Bring joy to your interface. Bouncy entrances, wobbly hovers, elastic springs, and celebratory confetti — for products that don't take themselves too seriously.",
    accent: "oklch(0.75 0.2 40)",
    icon: "",
    difficulty: "Beginner",
    effectIds: [
      "bounce-in",
      "jello",
      "wobble",
      "tada",
      "swing",
      "rubber-band",
      "wiggle",
      "hover-bounce",
      "text-bounce-letters",
      "loader-dots",
      "misc-confetti",
      "misc-sparkles",
    ],
    tags: ["playful", "fun", "bounce", "wobble", "spring", "celebrate", "joy", "energetic"],
    whenToUse:
      "Consumer apps, kids' products, game UIs, onboarding flows, celebration moments, and any brand with a friendly personality.",
  },
  {
    id: "holographic-iridescent",
    name: "Holographic & Iridescent",
    tagline: "Shimmering surfaces, prism light, and liquid metal",
    description:
      "The holographic trend from 2025. Iridescent surfaces, prism light refraction, chrome reflections, and liquid metal — effects that catch the eye and refuse to let go.",
    accent: "oklch(0.75 0.2 300)",
    icon: "",
    difficulty: "Advanced",
    effectIds: [
      "visual-holographic",
      "visual-iridescent",
      "visual-prism",
      "visual-chrome",
      "visual-metallic",
      "visual-foil",
      "text-holographic",
      "text-chrome",
      "visual-liquid-fill",
      "liquid-metal",
      "visual-gradient-mesh",
      "visual-shimmer-sweep",
    ],
    tags: ["holographic", "iridescent", "prism", "chrome", "metallic", "shimmer", "holo", "rainbow"],
    whenToUse:
      "Product launches, fashion/beauty brands, NFT/crypto art, premium packaging, and hero sections that need to stop the scroll.",
  },
  {
    id: "loaders-progress",
    name: "Loaders & Progress",
    tagline: "66 ways to say 'just a moment'",
    description:
      "Every loading scenario covered. Spinners for short waits, skeletons for content, progress bars for uploads, and creative loaders that entertain while they wait.",
    accent: "oklch(0.65 0.15 180)",
    icon: "",
    difficulty: "Beginner",
    effectIds: [
      "loader-spinner",
      "loader-dots",
      "loader-bars",
      "loader-orbit",
      "loader-pulse-ring",
      "loader-dual-ring",
      "loader-chasing-dots",
      "loader-fading-dots",
      "loader-grid",
      "loader-ripple",
      "loader-progress-bar",
      "loader-skeleton",
    ],
    tags: ["loader", "spinner", "progress", "loading", "skeleton", "waiting", "indicator"],
    whenToUse:
      "Every app needs loading states. Use spinners for <2s waits, skeletons for content loads, and progress bars for uploads.",
  },
  {
    id: "button-interactions",
    name: "Button Interactions",
    tagline: "55 buttons that beg to be clicked",
    description:
      "The complete button effects toolkit. Shine sweeps, fill slides, ripples, glows, 3D pushes, neon outlines, and gradient glows — every click should feel satisfying.",
    accent: "oklch(0.6 0.2 160)",
    icon: "",
    difficulty: "Beginner",
    effectIds: [
      "btn-shine-sweep",
      "btn-fill-slide",
      "btn-ripple",
      "btn-border-draw",
      "btn-glow",
      "btn-pulse",
      "btn-bounce",
      "btn-press",
      "btn-lift",
      "btn-slide-bg",
      "btn-3d-push",
      "btn-neon",
    ],
    tags: ["button", "btn", "click", "interaction", "cta", "hover", "press"],
    whenToUse:
      "CTA buttons, form submits, navigation actions, and any clickable element that should provide tactile feedback.",
  },
  {
    id: "text-effects",
    name: "Text Effects",
    tagline: "101 ways to make words matter",
    description:
      "Typography that commands attention. Gradients, neon glows, glitch effects, 3D shadows, shimmer sweeps, and typewriter cursors — for headlines that stop the scroll.",
    accent: "oklch(0.7 0.18 20)",
    icon: "",
    difficulty: "Intermediate",
    effectIds: [
      "text-gradient",
      "text-neon-glow",
      "text-stroke",
      "text-typing-cursor",
      "text-glitch",
      "text-3d-shadow",
      "text-rainbow",
      "text-shimmer",
      "text-gradient-shift",
      "text-blur-reveal",
      "text-wave",
      "text-holographic",
    ],
    tags: ["text", "typography", "headline", "gradient", "neon", "glitch", "shimmer"],
    whenToUse:
      "Hero headlines, section titles, logos, and any text that should be the focal point of the design.",
  },
  {
    id: "scroll-reveal",
    name: "Scroll Reveal",
    tagline: "Content that unfolds as you scroll",
    description:
      "Scroll-triggered animations that guide users through your content. Reveal-up, parallax, progress bars, and staggered entrances — for storytelling that unfolds naturally.",
    accent: "oklch(0.65 0.12 260)",
    icon: "",
    difficulty: "Intermediate",
    effectIds: [
      "scroll-reveal-up",
      "scroll-reveal-left",
      "scroll-reveal-right",
      "scroll-reveal-scale",
      "scroll-reveal-rotate",
      "scroll-progress-bar",
      "scroll-parallax-slow",
      "scroll-indicator",
      "fade-in-up",
      "slide-in-left",
      "slide-in-right",
      "zoom-in",
    ],
    tags: ["scroll", "reveal", "parallax", "progress", "stagger", "entrance", "story"],
    whenToUse:
      "Landing pages, case studies, long-form content, product tours, and any page where the narrative unfolds as the user scrolls.",
  },
  {
    id: "creative-borders",
    name: "Creative Borders",
    tagline: "30 borders that frame your content",
    description:
      "Borders that are anything but basic. Animated dashes, marching ants, corner brackets, gradient outlines, neon pulses, and torn paper — for elements that stand out from the edges.",
    accent: "oklch(0.7 0.15 140)",
    icon: "",
    difficulty: "Intermediate",
    effectIds: [
      "visual-border-beam",
      "visual-aurora-border",
      "border-animated-dash",
      "border-marching-ants",
      "border-corner-brackets",
      "border-clip-path",
      "border-gradient-animated",
      "border-neon-pulse",
      "border-torn-paper",
      "border-sticker",
      "hover-border-draw",
      "btn-border-draw",
    ],
    tags: ["border", "outline", "frame", "animated", "gradient", "neon", "creative"],
    whenToUse:
      "Feature cards, callout boxes, image frames, selection states, and any element that needs to stand out via its boundary.",
  },
  {
    id: "particle-ambient",
    name: "Particle & Ambient",
    tagline: "Environmental effects that set the mood",
    description:
      "Particles that float, fall, and sparkle. Snow, rain, confetti, fireflies, bubbles, sparks, and fireworks — for backgrounds and celebration moments that fill the screen with life.",
    accent: "oklch(0.75 0.18 100)",
    icon: "",
    difficulty: "Advanced",
    effectIds: [
      "particles-floating-dots",
      "particles-confetti-burst",
      "particles-snow-fall",
      "particles-rain",
      "particles-fireflies",
      "particles-bubbles",
      "particles-sparks",
      "misc-confetti",
      "misc-snow",
      "misc-fireflies",
      "misc-sparkles",
      "misc-fireworks",
    ],
    tags: ["particle", "ambient", "snow", "rain", "confetti", "firefly", "bubble", "spark", "firework"],
    whenToUse:
      "Hero backgrounds, celebration overlays (success, achievement), seasonal themes, and any moment that deserves visual fireworks.",
  },
];

export const collectionCategoryMeta: Record<string, { label: string; description: string }> = {
  aesthetic: {
    label: "Aesthetic",
    description: "Collections grouped by visual style and design language",
  },
  functional: {
    label: "Functional",
    description: "Collections grouped by UI purpose and use case",
  },
};

export function searchCollections(query: string): Collection[] {
  const q = query.toLowerCase().trim();
  if (!q) return collections;
  return collections.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tagline.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)) ||
      c.whenToUse.toLowerCase().includes(q),
  );
}

export function getCollectionWithEffects(
  collection: Collection,
): { collection: Collection; effects: CSSEffect[] } {
  const collectionEffects = collection.effectIds
    .map((id) => effects.find((e) => e.id === id))
    .filter((e): e is CSSEffect => e !== undefined);
  return { collection, effects: collectionEffects };
}

export function getCollectionsContainingEffect(effectId: string): Collection[] {
  return collections.filter((c) => c.effectIds.includes(effectId));
}
