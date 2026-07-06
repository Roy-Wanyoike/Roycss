import { type Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./roycss.css";
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
  title: "RoyCSS — Beautiful CSS Effects Library with Live Demos",
  description:
    "A curated collection of 35+ production-ready CSS effects by Roy Wanyoike. Animations, hover effects, text effects, loaders, 3D transforms, buttons, and cards — all with live demonstrations and copy-paste code.",
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
    "Roy Wanyoike",
    "CSS library",
  ],
  authors: [{ name: "Royford Wanyoike Wamaitha" }],
  openGraph: {
    title: "RoyCSS — Beautiful CSS Effects Library",
    description:
      "Production-ready CSS effects with live demonstrations and copy-paste code. 35+ effects across 8 categories.",
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