import { type Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./roycss.css";
import "./roymotion.css";
import { allEffectCSS } from "@/lib/roycss-effects";
import { Toaster } from "@/components/ui/toaster";

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
  title: "RoyCSS — 700+ Beautiful CSS Effects Library with Live Demos",
  description:
    "A curated collection of 700+ production-ready CSS effects by Roy Wanyoike. Modern CSS, creative art, physics springs, scroll-driven animations, optical illusions, CSS paintings, seasonal themes, game UI, retro aesthetics, data viz, and more — with live demos, copy-paste code, and framework support for React, Vue, Angular, Svelte, and vanilla HTML.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
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
  openGraph: {
    title: "RoyCSS — 260+ Beautiful CSS Effects Library",
    description:
      "Production-ready CSS effects with live demonstrations and copy-paste code. 260+ effects across 13 categories.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Inject all effect CSS server-side to avoid FOUC */}
        <style dangerouslySetInnerHTML={{ __html: allEffectCSS }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}