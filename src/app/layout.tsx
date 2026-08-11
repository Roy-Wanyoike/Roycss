import { type Metadata, type Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./roycss.css";
import "./roymotion.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from "@/components/roycss/sw-register";

/**
 * Pre-hydration theme script.
 *
 * Runs synchronously in <head> BEFORE React hydrates so the correct `dark`
 * class is on <html> for the very first paint — eliminating the
 * flash-of-unstyled-content (FOUC) that would otherwise occur when a
 * user with a saved `roycss-theme=light` preference loads the page
 * (the hardcoded `className="dark"` on <html> would briefly paint dark
 * before ThemeToggle's useEffect runs and flips to light).
 *
 * Mirrors the localStorage key (`roycss-theme`) and prefers-color-scheme
 * fallback used by the ThemeToggle component in roycss-page.tsx. Wrapped
 * in a try/catch so the page still renders if localStorage is blocked
 * (private mode, cookies disabled, etc.).
 */
const themeInitScript = `(function(){try{var k='roycss-theme';var s=localStorage.getItem(k);var d=s==='dark'||((!s||s==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

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
  title: "RoyCSS — 1569+ Beautiful CSS Effects Library with Live Demos",
  description:
    "A curated collection of 1569+ production-ready CSS effects by Roy Wanyoike. Future-trending effects for 2026-2030: spatial depth, liquid glass, bioluminescent UI, kinetic typography, holographic surfaces, neural networks, and more — with live demos, copy-paste code, and framework support for React, Vue, Angular, Svelte, and vanilla HTML.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
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
  ],
  authors: [{ name: "Royford Wanyoike Wamaitha" }],
  creator: "Royford Wanyoike Wamaitha",
  publisher: "Royford Wanyoike Wamaitha",
  metadataBase: new URL("https://roycss.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RoyCSS — 1569+ Beautiful CSS Effects Library with Live Demos",
    description:
      "1569+ production-ready CSS effects with live demos, color customization, and framework support for React, Vue, Angular, Svelte, and vanilla HTML.",
    type: "website",
    url: "https://roycss.com",
    siteName: "RoyCSS",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoyCSS — 1569+ Beautiful CSS Effects Library",
    description:
      "1569+ production-ready CSS effects with live demos, copy-paste code, and framework support.",
    creator: "@wanyoikeroy",
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
  maximumScale: 5,
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}