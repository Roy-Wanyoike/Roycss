import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
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
  title: "Royford Wanyoike — Software Engineer & Developer Advocate",
  description:
    "Royford Wanyoike is a Nairobi-based Software Engineer and Developer Advocate with 3+ years building scalable full-stack applications and low-code solutions. Quickbase Professional Builder, 20x+ conference speaker, and open-source contributor.",
  keywords: [
    "Royford Wanyoike",
    "Roy Wanyoike",
    "Software Engineer Nairobi",
    "Developer Advocate Kenya",
    "Quickbase Builder",
    "Full-Stack Developer",
    "React",
    "Next.js",
    "Node.js",
    "Angular",
    "Svelte",
  ],
  authors: [{ name: "Royford Wanyoike" }],
  openGraph: {
    title: "Royford Wanyoike — Software Engineer & Developer Advocate",
    description:
      "Building scalable full-stack applications and low-code solutions from Nairobi, Kenya.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Royford Wanyoike — Software Engineer & Developer Advocate",
    description:
      "Building scalable full-stack applications and low-code solutions from Nairobi, Kenya.",
  },
};

// JSON-LD Person schema — helps recruiters find Royford via Google/search engines
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Royford Wanyoike",
  jobTitle: "Software Engineer & Developer Advocate",
  description:
    "Software Engineer with 3+ years building scalable full-stack applications and low-code solutions. Quickbase Professional Builder certified. 20+ conference talks delivered.",
  email: "mailto:roywanyoike328@gmail.com",
  telephone: "+254706103000",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nairobi",
    addressCountry: "Kenya",
  },
  knowsAbout: [
    "React",
    "Next.js",
    "Node.js",
    "TypeScript",
    "Angular",
    "Vue.js",
    "Svelte",
    "Quickbase",
    "Developer Advocacy",
    "Technical Speaking",
  ],
  sameAs: [
    "https://www.linkedin.com/in/roywanyoike/",
    "https://github.com/Roy-Wanyoike",
    "https://x.com/WanyoikeRoyford",
    "https://sessionize.com/royford-wanyoike",
    "https://linktr.ee/roywanyoike",
    "https://public.tableau.com/app/profile/royford.wanyoike",
  ],
  worksFor: {
    "@type": "Organization",
    name: "Imminent Transcendent Solutions",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Kibabii University",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
