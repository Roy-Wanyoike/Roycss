import type { CSSEffect } from "./roycss-types";
import { effects } from "./roycss-effects";

/**
 * RoyCSS Collections — curated themed bundles of effects.
 *
 * With 1749 effects, discoverability is a challenge. Collections solve this
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
    icon: "🍎",
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
    icon: "🌃",
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
    icon: "🪟",
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
    icon: "✨",
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
    icon: "🎉",
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
    icon: "🌈",
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
    icon: "⏳",
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
    icon: "🔘",
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
    icon: "🔤",
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
    icon: "📜",
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
    icon: "🖼️",
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
    icon: "✨",
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
  {
    id: "3d-spatial",
    name: "3D & Spatial Design",
    tagline: "Depth, perspective, and three-dimensional transforms",
    description: "Create depth with 3D transforms, perspective, card flips, and spatial effects. Perfect for immersive product showcases and interactive galleries.",
    accent: "oklch(0.7 0.18 50)",
    icon: "🎲",
    difficulty: "Advanced",
    effectIds: ["flip-in-x", "flip-in-y", "hover-tilt-rotate", "hover-flip", "hover-depth", "text-3d-shadow", "card-flip", "hover-shadow-grow", "loader-cube", "text-shadow-long", "text-mirror", "hover-zoom-blur"],
    tags: ["3d", "spatial", "perspective", "depth", "transform", "flip", "cube", "immersive"],
    whenToUse: "Product showcases, interactive galleries, flip cards, immersive hero sections, and any UI that needs depth without WebGL.",
  },
  {
    id: "dark-mode-drama",
    name: "Dark Mode Drama",
    tagline: "Glowing effects optimized for dark backgrounds",
    description: "Effects that shine in dark mode — glows, neon shadows, spotlights, and dramatic highlights. Every effect is designed for dark backgrounds where light elements pop.",
    accent: "oklch(0.65 0.2 280)",
    icon: "🌙",
    difficulty: "Intermediate",
    effectIds: ["pulse-glow", "text-neon-glow", "hover-neon-flicker", "hover-glow-border", "hover-shadow-grow", "hover-drop-shadow", "text-3d-shadow", "text-shadow-long", "text-shadow-soft", "pulse-soft", "hover-depth", "hover-push-up"],
    tags: ["dark", "mode", "glow", "neon", "shadow", "dramatic", "spotlight", "night"],
    whenToUse: "Dark-themed dashboards, gaming interfaces, developer tools, crypto apps, and any dark mode UI that needs visual punch.",
  },
  {
    id: "form-input-effects",
    name: "Form & Input Effects",
    tagline: "Microinteractions for delightful form experiences",
    description: "Focus glows, floating labels, validation feedback, toggle switches, and custom checkboxes. Turn boring forms into delightful microinteraction showcases.",
    accent: "oklch(0.7 0.15 160)",
    icon: "📝",
    difficulty: "Beginner",
    effectIds: ["form-focus-glow", "form-label-float", "form-error-shake", "form-success-check", "form-toggle-switch", "form-checkbox-custom", "form-radio-custom", "form-placeholder-shimmer", "micro-checkbox-check", "micro-toggle-switch", "micro-tooltip-appear", "micro-radio-select"],
    tags: ["form", "input", "label", "focus", "validation", "toggle", "checkbox", "radio", "microinteraction"],
    whenToUse: "Login forms, signup flows, settings panels, survey forms, and any input-heavy interface where microinteractions improve UX.",
  },
  {
    id: "gaming-ui",
    name: "Gaming UI",
    tagline: "High-energy effects for games and esports",
    description: "Flashy, energetic effects inspired by arcade games and esports platforms. Fire, sparks, retro scanlines, and explosive celebrations — built for high-adrenaline interfaces.",
    accent: "oklch(0.7 0.25 30)",
    icon: "🎮",
    difficulty: "Advanced",
    effectIds: ["flash", "text-fire", "loader-pacman", "btn-shadow-push", "btn-sparkle", "misc-fireworks", "misc-sparkles", "misc-vhs-effect", "blink", "particles-sparks", "misc-confetti", "vibrate"],
    tags: ["gaming", "arcade", "retro", "flash", "fire", "spark", "explosion", "esports", "energy"],
    whenToUse: "Game interfaces, esports platforms, achievement unlocks, leaderboard celebrations, and any brand targeting a gaming audience.",
  },
  {
    id: "ecommerce-essentials",
    name: "E-commerce Essentials",
    tagline: "Effects that drive conversions and trust",
    description: "Shine sweeps on CTAs, marching ants on sale items, shimmer placeholders for product images, progress bars for checkout. Every effect an online store needs.",
    accent: "oklch(0.7 0.2 160)",
    icon: "🛒",
    difficulty: "Beginner",
    effectIds: ["btn-shine-sweep", "border-marching-ants", "border-ribbon", "text-shimmer", "loader-progress-bar", "loader-skeleton", "form-placeholder-shimmer", "bg-gradient-sweep", "misc-shimmer-overlay", "cursor-trail", "btn-fill-slide", "btn-glow"],
    tags: ["ecommerce", "shop", "store", "cta", "sale", "checkout", "conversion", "trust", "cart"],
    whenToUse: "Product pages, checkout flows, sale banners, CTA buttons, loading states for product images, and any e-commerce interface.",
  },
  {
    id: "social-notifications",
    name: "Social & Notifications",
    tagline: "Pulses, badges, and attention-grabbing alerts",
    description: "Heartbeat pulses, notification badges, dot indicators, and chasing dots. Everything you need for social media feeds, notification centers, and real-time activity.",
    accent: "oklch(0.7 0.2 350)",
    icon: "🔔",
    difficulty: "Beginner",
    effectIds: ["pulse-glow", "heartbeat", "shake", "pulse-soft", "notification-badge", "bg-gradient-pulse", "loader-dots", "loader-pulse-ring", "loader-chasing-dots", "loader-fading-dots", "micro-bell-shake-b18", "micro-toast-slide"],
    tags: ["social", "notification", "badge", "pulse", "alert", "activity", "feed", "real-time"],
    whenToUse: "Social feeds, notification panels, activity indicators, unread badges, live updates, and messaging apps.",
  },
  {
    id: "error-success-states",
    name: "Error & Success States",
    tagline: "Clear feedback for every outcome",
    description: "Shake on error, checkmark on success, confetti on achievement. These effects give users immediate, satisfying feedback for every action outcome.",
    accent: "oklch(0.65 0.2 140)",
    icon: "⚠️",
    difficulty: "Beginner",
    effectIds: ["shake", "head-shake", "form-error-shake", "form-success-check", "misc-confetti", "particles-confetti-burst", "micro-checkbox-check", "micro-toast-slide", "card-hover-wobble", "vibrate", "flash", "pulse-glow"],
    tags: ["error", "success", "feedback", "validation", "shake", "checkmark", "confetti", "celebration", "outcome"],
    whenToUse: "Form validation, payment success, achievement unlocks, error messages, delete confirmations, and any action that needs clear outcome feedback.",
  },
  {
    id: "background-patterns",
    name: "Background Patterns",
    tagline: "Subtle textures and gradients for depth",
    description: "Grid lines, dot patterns, mesh gradients, noise textures, and animated backgrounds. Add depth and visual interest without overwhelming content.",
    accent: "oklch(0.7 0.15 200)",
    icon: "🎨",
    difficulty: "Intermediate",
    effectIds: ["bg-animated-gradient", "bg-dot-pattern", "bg-mesh-gradient", "bg-grid-lines", "bg-noise", "bg-gradient-sweep", "bg-gradient-pulse", "bg-concentric", "bg-lava-lamp", "bg-plasma", "bg-aurora", "bg-diagonal-stripes"],
    tags: ["background", "pattern", "grid", "dots", "gradient", "noise", "texture", "mesh", "texture"],
    whenToUse: "Hero sections, dashboard backgrounds, card backdrops, section dividers, and any area that needs subtle visual texture.",
  },
  {
    id: "navigation-toolkit",
    name: "Navigation Toolkit",
    tagline: "Menu, tab, and navigation animations",
    description: "Sliding menus, underline tabs, breadcrumb trails, step indicators, dropdowns, and accordions. Complete navigation patterns for any app structure.",
    accent: "oklch(0.7 0.18 260)",
    icon: "🧭",
    difficulty: "Intermediate",
    effectIds: ["nav-menu-slide", "nav-menu-fade", "nav-menu-scale", "nav-tabs-underline", "nav-breadcrumb", "nav-pagination", "nav-stepper", "nav-progress-indicator", "nav-dropdown", "nav-accordion", "micro-accordion-expand", "accordion-3d"],
    tags: ["navigation", "menu", "tab", "accordion", "breadcrumb", "pagination", "dropdown", "stepper", "nav"],
    whenToUse: "App sidebars, tab bars, multi-step forms, breadcrumbs, settings panels, and any navigation-heavy interface.",
  },
  {
    id: "hover-lab",
    name: "Hover Lab",
    tagline: "110 hover effects for every interaction",
    description: "The complete hover effect toolkit — scale, lift, glow, tilt, zoom, color shift, overlay reveal, and more. Every way to respond to user hover.",
    accent: "oklch(0.7 0.2 180)",
    icon: "🖱️",
    difficulty: "Beginner",
    effectIds: ["hover-scale", "hover-underline-slide", "hover-glow-border", "hover-shadow-grow", "hover-color-shift", "hover-tilt-rotate", "hover-zoom-blur", "hover-overlay-reveal", "hover-push-up", "hover-flip", "hover-rotate", "hover-bounce"],
    tags: ["hover", "interaction", "scale", "lift", "glow", "tilt", "zoom", "color", "overlay", "mouse"],
    whenToUse: "Cards, buttons, images, links, nav items, and any element that should respond visually to mouse hover.",
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
