import { type Metadata, type Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./roycss.css";
import "./roymotion.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/roycss/sw-register";

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
 */
const themeInitScript = `(function(){try{var k='roycss-theme';var s=localStorage.getItem(k);var d=s==='dark'||((!s||s==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

/**
 * JSON-LD structured data for SEO rich results.
 * Tells search engines this is a SoftwareApplication with feature descriptions.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RoyCSS",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description:
    "RoyCSS is a modern, AI-native frontend engineering platform — 1,749 CSS effects, 62 platform products, 64 developer tools, design systems, and AI assistance.",
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
    "1,749 CSS effects with live demos",
    "62 platform products (components, AI, dev tools, enterprise)",
    "64 developer tools (CSS generators, visualizers, analyzers)",
    "AI-native development (RoyAI, Roy Architect, Roy MCP)",
    "Design system (OKLCH tokens, 10 theme presets)",
    "Accessibility-first (WCAG 2.2 AA)",
    "Framework-agnostic (React, Vue, Angular, Svelte)",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "1",
  },
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
  title: "RoyCSS — AI-Native Frontend Engineering Platform",
  description:
    "RoyCSS is a modern, AI-native frontend engineering platform — 1,749 CSS effects, 62 platform products, 64 developer tools, design systems, and AI assistance. Design, build, customize, and ship modern interfaces in one cohesive ecosystem.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [
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
  metadataBase: new URL("https://roycss.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RoyCSS — AI-Native Frontend Engineering Platform",
    description:
      "1,749 CSS effects, 62 platform products, 64 developer tools, and AI assistance — design, build, customize, and ship modern interfaces in one cohesive ecosystem.",
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
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoyCSS — AI-Native Frontend Engineering Platform",
    description:
      "1,749 CSS effects, 62 platform products, 64 developer tools, and AI assistance — design, build, and ship modern interfaces.",
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
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="bottom-right" richColors closeButton />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
