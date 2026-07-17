import { type Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./roycss.css";
import "./roymotion.css";
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
  title: "RoyCSS — 760+ Beautiful CSS Effects Library with Live Demos",
  description:
    "A curated collection of 760+ production-ready CSS effects by Roy Wanyoike. Future-trending effects for 2026-2030: spatial depth, liquid glass, bioluminescent UI, kinetic typography, holographic surfaces, neural networks, and more — with live demos, copy-paste code, and framework support for React, Vue, Angular, Svelte, and vanilla HTML.",
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
    title: "RoyCSS — 760+ Beautiful CSS Effects Library with Live Demos",
    description:
      "760+ production-ready CSS effects with live demos, color customization, and framework support.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}