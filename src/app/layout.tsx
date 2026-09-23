import { type Metadata, type Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import "./roycss.css";
import "./roymotion.css";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/roycss/sw-register";
import { AuthProvider } from "@/components/roycss/auth/auth-context";
import {
  EFFECT_COUNT_FORMATTED,
  PRODUCT_COUNT,
  TOOL_COUNT,
} from "@/lib/site-stats";

/**
 * Pre-hydration theme script.
 *
 * Runs synchronously in <head> BEFORE React hydrates so the correct `dark`
 * class is on <html> for the very first paint — eliminating the
 * flash-of-unstyled-content (FOUC) that would otherwise occur when a
 * user with a saved `roycss-theme=light` preference loads the page.
 *
 * Sets BOTH the `.dark` class AND `color-scheme` inline style so they
 * always agree (prevents the dark-class + light-color-scheme mismatch).
 *
 * Issue #160: stored values are validated (light/dark/system); missing,
 * corrupt, or "system" values fall back to the OS preference. These
 * semantics are the exact mirror of `resolveInitialDark()` in
 * src/components/ui-library/foundation/theme-storage.ts and are kept in
 * lockstep by tests/unit/theme-persistence.test.ts. This script never
 * WRITES the key — only the user's toggle (ThemeToggle) does.
 */
const themeInitScript = `(function(){try{var k='roycss-theme';var s=localStorage.getItem(k);var v=(s==='light'||s==='dark'||s==='system')?s:'system';var d=v==='dark'||(v==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

/**
 * Pre-hydration animation-pause script (issue #214 tail).
 *
 * Runs synchronously in <head> BEFORE first paint so a visitor who saved
 * "Pause animations" (`roycss-animations-paused=true`, written by the
 * PauseAnimationsToggle toggle handler) never sees a single frame of the
 * marquee/carousel movement — the pause lands pre-paint, not on mount.
 *
 * Contract (mirrors themeInitScript, kept in lockstep by
 * tests/unit/animation-pause-storage.test.ts):
 *   - accepts ONLY the exact strings "true"/"false" (anything else —
 *     missing, corrupt, or a throwing storage — means "running");
 *   - READ-ONLY: it never WRITES the key. Only the user's toggle handler
 *     persists, so a stale script can never clobber the stored choice
 *     (issue #160 regression class).
 *
 * Kept as a SEPARATE const so the themeInitScript literal (regex-pinned
 * by tests/unit/theme-persistence.test.ts) stays byte-identical.
 */
const pauseInitScript = `(function(){try{var k='roycss-animations-paused';var s=localStorage.getItem(k);if(s==='true'){document.documentElement.setAttribute('data-animations-paused','true');}}catch(e){}})();`;

/**
 * Pre-hydration locale script (issue #129 PR-A — i18n scaffolding).
 *
 * Runs synchronously in <head> BEFORE React hydrates and applies the
 * user's stored locale to documentElement as lang/dir attributes — the
 * same pre-paint contract as themeInitScript above, so the document
 * direction is correct for the very first paint (essential for RTL in
 * PR-B: dir="rtl" must be on <html> before any CSS layout runs).
 *
 * T is the locale → [lang, dir] table. It is the exact mirror of
 * LOCALES + localeDirection() in
 * src/components/ui-library/foundation/locale-storage.ts and is kept in
 * lockstep by tests/unit/locale-persistence.test.ts. Unknown/corrupt
 * values fall back to en/ltr (T[s] is validated before use). PR-B adds
 * "ar" to the table (['ar','rtl']) and to messages/.
 *
 * The request locale itself is STATIC "en" for every render
 * (src/i18n/request.ts — no cookies()/headers() read, keeping every page
 * statically prerendered per the #54 architecture constraint); this
 * script is the client-side complement. It never WRITES the key — only
 * the LanguageToggle does.
 */
const localeInitScript = `(function(){try{var T={"en":["en","ltr"]};var s=localStorage.getItem('roycss-locale');var c=(s&&T[s]&&T[s].length===2)?T[s]:T.en;var r=document.documentElement;r.lang=c[0];r.dir=c[1];}catch(e){}})();`;

/**
 * JSON-LD structured data for SEO rich results (issue #188 item 5).
 *
 * A single @graph with three entities:
 *   - SoftwareApplication — the product (feature descriptions, free offer)
 *   - WebSite — the site entity (rich-result eligibility)
 *   - Organization — the publisher/creator entity
 *
 * The FAQPage graph lives in src/app/page.tsx (built from
 * src/lib/faq-data.ts so questions/answers match the rendered FAQ).
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "RoyCSS",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description: `RoyCSS is a modern, AI-native frontend engineering platform — ${EFFECT_COUNT_FORMATTED} CSS effects, ${PRODUCT_COUNT} platform products, ${TOOL_COUNT} developer tools, design systems, and AI assistance.`,
      url: "https://roycss.com",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      creator: {
        "@type": "Person",
        name: "Royford Wanyoike Wamaitha",
      },
      featureList: [
        `${EFFECT_COUNT_FORMATTED} CSS effects with live demos`,
        `${PRODUCT_COUNT} platform products (components, AI, dev tools, enterprise)`,
        `${TOOL_COUNT} developer tools (CSS generators, visualizers, analyzers)`,
        "AI-native development (RoyAI, Roy Architect, Roy MCP)",
        "Design system (OKLCH tokens, 10 theme presets)",
        "Accessibility-first (WCAG 2.2 AA)",
        "Framework-agnostic (React, Vue, Angular, Svelte)",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://roycss.com/#website",
      name: "RoyCSS",
      url: "https://roycss.com",
      description: `${EFFECT_COUNT_FORMATTED} pure-CSS effects with live previews and copy-paste code — plus developer tools, design tokens, and AI assistance.`,
      inLanguage: "en-US",
      publisher: { "@id": "https://roycss.com/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://roycss.com/#organization",
      name: "RoyCSS",
      url: "https://roycss.com",
      logo: {
        "@type": "ImageObject",
        url: "https://roycss.com/icon-512.png",
      },
      founder: {
        "@type": "Person",
        name: "Royford Wanyoike Wamaitha",
      },
      sameAs: ["https://github.com/Roy-Wanyoike/Roycss"],
    },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // Home title leads with the primary query "CSS effects library"
  // (issue #188 item 3). Deliberately a plain string, NOT a
  // { default, template } pair: every child page (docs, effects,
  // legal, 404) already exports its own complete title, so a template
  // would double-suffix them ("CLI — RoyCSS Docs — RoyCSS").
  title: "RoyCSS — CSS Effects Library & AI-Native Frontend Platform",
  description: `RoyCSS is a modern, AI-native frontend engineering platform — ${EFFECT_COUNT_FORMATTED} CSS effects, ${PRODUCT_COUNT} platform products, ${TOOL_COUNT} developer tools, design systems, and AI assistance. Design, build, customize, and ship modern interfaces in one cohesive ecosystem.`,
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "1024x1024", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  keywords: [
    "RoyCSS",
    "CSS effects library",
    "CSS animations",
    "hover effects",
    "CSS text effects",
    "glassmorphism",
    "neon effects",
    "CSS loaders",
    "3D CSS transforms",
    "CSS filters",
    "CSS borders",
    "Roy Wanyoike",
    "CSS library",
    "frontend platform",
    "AI frontend",
    "component library",
  ],
  authors: [{ name: "Royford Wanyoike Wamaitha" }],
  creator: "Royford Wanyoike Wamaitha",
  publisher: "Royford Wanyoike Wamaitha",
  // Canonical origin (issue #113 / UIX-F12): every SEO signal is unified on
  // https://roycss.com — metadataBase + OG url here, JSON-LD url above,
  // SITE_URL in src/app/effects/_lib/static-effects.ts (sitemap + effect
  // canonicals), and robots.ts. 301-redirecting the alternate domain to
  // this origin is an owner-side Vercel-domains action tracked in
  // issue #113 (see docs/OWNER-RUNBOOK.md §7). Vercel preview deployments
  // still resolve relative metadata via Next's fallback.
  //
  // NO root-level `alternates.canonical` (issue #187): the old
  // `canonical: "/"` default was inherited by ~40 pages (all docs,
  // /roadmap, /privacy, /terms), telling Google to fold them into the
  // homepage. Each page now declares its own self-canonical via the
  // pageMeta() helper in src/lib/seo.ts.
  metadataBase: new URL("https://roycss.com"),
  openGraph: {
    title: "RoyCSS — CSS Effects Library & AI-Native Frontend Platform",
    description: `${EFFECT_COUNT_FORMATTED} CSS effects, ${PRODUCT_COUNT} platform products, ${TOOL_COUNT} developer tools, and AI assistance — design, build, customize, and ship modern interfaces in one cohesive ecosystem.`,
    type: "website",
    url: "https://roycss.com",
    siteName: "RoyCSS",
    locale: "en_US",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "RoyCSS — AI-Native Frontend Engineering Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoyCSS — CSS Effects Library & AI-Native Frontend Platform",
    description: `${EFFECT_COUNT_FORMATTED} CSS effects, ${PRODUCT_COUNT} platform products, ${TOOL_COUNT} developer tools, and AI assistance — design, build, and ship modern interfaces.`,
    creator: "@wanyoikeroy",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
  appleWebApp: {
    capable: true,
    title: "RoyCSS",
    statusBarStyle: "black-translucent",
  },
  // Issue #206 item 7 (owner-side #113): Search Console verification is
  // an env hook, not a hardcoded token — set GOOGLE_SITE_VERIFICATION in
  // the deployment env and the <meta name="google-site-verification">
  // tag appears; unset, nothing renders. (Not at page level: this is
  // site-wide owner verification.)
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // NOTE: no headers() call here on purpose. The old per-request CSP nonce
  // (x-nonce) was removed with the static-safe CSP fix (#54) — proxy.ts no
  // longer sets that header, and reading headers() forces EVERY page into
  // dynamic streaming (killing static prerendering and turning notFound()
  // into soft 200 responses app-wide). The production CSP now allows
  // 'unsafe-inline' scripts, so nonce attributes are neither needed nor set.

  return (
    <html lang="en" suppressHydrationWarning className="dark" data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Issue #214: re-apply the persisted "Pause animations" preference
            before first paint. Read-only — see pauseInitScript above. */}
        <script dangerouslySetInnerHTML={{ __html: pauseInitScript }} />
        {/* Issue #129 PR-A: apply the persisted locale as html lang/dir before
            first paint. Read-only — see localeInitScript above. */}
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {/* next-intl "without i18n routing" (issue #129 PR-A): the provider
              inherits the STATIC en config from src/i18n/request.ts so client
              components (chrome) can consume useTranslations. Server
              components use getTranslations from next-intl/server. No locale
              segment, no middleware — every route stays static. */}
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </AuthProvider>
        {/* Single toast system (issue #114): sonner only — theme-aware via
            next-themes, bottom-right, richColors + closeButton to match the
            previous sonner call sites (auth flows, copy actions, newsletter). */}
        <Toaster position="bottom-right" richColors closeButton />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
