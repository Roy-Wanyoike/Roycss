"use client";

/**
 * PluginHub — RoyCSS plugin ecosystem hub.
 *
 * Self-contained (no props). Twelve mock plugins with rich metadata
 * rendered in a responsive card grid. Features:
 *
 *   • Search bar — case-insensitive filter on plugin name / description.
 *   • Category filter chips — All / Auth / Payments / Database / Maps /
 *     Editor / Analytics / Email / Monitoring / Uploads (single-select).
 *   • Sort — Popular (weekly downloads desc) / Newest (publishedAt desc) /
 *     Rating (rating desc, ties broken by downloads).
 *   • Stats header — "N plugins · M verified · K categories · Total
 *     downloads: X" (compact-formatted, e.g. "1.2M").
 *   • Card click — opens a Dialog detail view with full description,
 *     feature list, step-by-step install instructions, a configuration
 *     code example (with its own Copy button), RoyCSS version
 *     compatibility, and a changelog summary.
 *
 * Each plugin card shows:
 *   • A gradient "tile" with a category-representative lucide icon
 *     (gradients use the approved palette — emerald, teal, cyan, amber,
 *     rose, violet, fuchsia, orange, pink — NO indigo / blue).
 *   • Verified badge (BadgeCheck) overlay when `verified === true`.
 *   • Plugin name + semantic version (e.g. v2.4.1).
 *   • Category badge (color-coded per category).
 *   • Short description (line-clamped to 2 lines).
 *   • Weekly downloads count (compact, e.g. "12.8K").
 *   • Star rating (1–5, supports half-stars via a width-clipped overlay).
 *   • "Install" button — copies `npx roycss-cli plugin add <name>` to
 *     the clipboard and fires a toast.
 *   • "Docs" link — mock external link (`https://roycss.dev/plugins/<id>`).
 *
 * The Install action is also available inside the detail dialog and on
 * the configuration code block (copy snippet). All clipboard writes go
 * through a single guarded helper with a 2-second "Copied!" feedback
 * state per control.
 *
 * Filtering + sorting is fully memoized. TS strict, zero `any`.
 * SSR-safe — every `navigator` / `window` access is inside a
 * `useEffect`, callback, or runtime guard.
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownUp,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Check,
  Copy,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  Flame,
  History,
  KeyRound,
  Lock,
  type LucideIcon,
  Mail,
  Map as MapIcon,
  MousePointerClick,
  Package,
  PenLine,
  Plug,
  Puzzle,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Star,
  Terminal,
  Upload,
  Wrench,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Category =
  | "Auth"
  | "Payments"
  | "Database"
  | "Maps"
  | "Editor"
  | "Analytics"
  | "Email"
  | "Monitoring"
  | "Uploads";

type CategoryFilter = "All" | Category;

type SortKey = "popular" | "newest" | "rating";

interface ChangelogEntry {
  version: string;
  date: string; // ISO yyyy-mm-dd
  notes: string;
}

interface Plugin {
  id: string;
  /** CLI slug — appears in `npx roycss-cli plugin add <slug>`. */
  slug: string;
  name: string;
  category: Category;
  /** Semantic version, including the leading "v", e.g. "v2.4.1". */
  version: string;
  weeklyDownloads: number;
  /** 1–5, may be fractional (e.g. 4.5). */
  rating: number;
  verified: boolean;
  /** Publisher / maintainer name. */
  author: string;
  /** ISO date the plugin was first published. */
  publishedAt: string;
  /** Short one-liner shown on the card (line-clamped to 2 lines). */
  description: string;
  /** Longer prose shown in the detail dialog. */
  longDescription: string;
  /** Tailwind `bg-gradient-to-* from-... via-... to-...` classes. */
  gradient: string;
  /** Step-by-step install instructions (ordered list). */
  installSteps: readonly string[];
  /** Configuration code snippet (rendered in a <pre><code> block). */
  configExample: string;
  /** RoyCSS version range this plugin is compatible with. */
  compatibility: string;
  features: readonly string[];
  changelog: readonly ChangelogEntry[];
}

interface CategoryMeta {
  /** Badge classes for the small category label on cards. */
  badge: string;
  /** Subtle background tint used on the active filter chip. */
  chipActive: string;
  /** Lucide icon used as the category glyph. */
  icon: LucideIcon;
}

interface SortOption {
  value: SortKey;
  label: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const CATEGORY_ORDER: readonly CategoryFilter[] = [
  "All",
  "Auth",
  "Payments",
  "Database",
  "Maps",
  "Editor",
  "Analytics",
  "Email",
  "Monitoring",
  "Uploads",
] as const;

const SORT_OPTIONS: readonly SortOption[] = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Rating" },
] as const;

const CATEGORY_META: Record<Category, CategoryMeta> = {
  Auth: {
    badge:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    chipActive:
      "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
    icon: ShieldCheck,
  },
  Payments: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
    icon: CreditCard,
  },
  Database: {
    badge:
      "border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
    chipActive:
      "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/70 dark:text-teal-200",
    icon: Database,
  },
  Maps: {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
    icon: MapIcon,
  },
  Editor: {
    badge:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
    chipActive:
      "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-200",
    icon: PenLine,
  },
  Analytics: {
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    chipActive:
      "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
    icon: BarChart3,
  },
  Email: {
    badge:
      "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
    chipActive:
      "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800 dark:border-fuchsia-800 dark:bg-fuchsia-950/70 dark:text-fuchsia-200",
    icon: Send,
  },
  Monitoring: {
    badge:
      "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-900 dark:bg-orange-950/60 dark:text-orange-300",
    chipActive:
      "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950/70 dark:text-orange-200",
    icon: ShieldAlert,
  },
  Uploads: {
    badge:
      "border-pink-200 bg-pink-100 text-pink-700 dark:border-pink-900 dark:bg-pink-950/60 dark:text-pink-300",
    chipActive:
      "border-pink-300 bg-pink-100 text-pink-800 dark:border-pink-800 dark:bg-pink-950/70 dark:text-pink-200",
    icon: Upload,
  },
};

/** Per-plugin icon — overrides the category icon for visual variety. */
const PLUGIN_ICON: Record<string, LucideIcon> = {
  "plugin-stripe": CreditCard,
  "plugin-clerk": KeyRound,
  "plugin-supabase": Database,
  "plugin-firebase": Flame,
  "plugin-auth0": Lock,
  "plugin-mapbox": MapIcon,
  "plugin-chartjs": BarChart3,
  "plugin-tiptap": PenLine,
  "plugin-uploadthing": Upload,
  "plugin-resend": Mail,
  "plugin-posthog": MousePointerClick,
  "plugin-sentry": AlertTriangle,
};

const DOCS_URL_BASE = "https://roycss.dev/plugins";

// ─── Mock data (12 plugins) ─────────────────────────────────────────────
// Module-level for referential stability across renders.

const PLUGINS: readonly Plugin[] = [
  {
    id: "plugin-stripe",
    slug: "stripe",
    name: "Stripe",
    category: "Payments",
    version: "v2.4.1",
    weeklyDownloads: 184_320,
    rating: 4.9,
    verified: true,
    author: "Stripe Inc.",
    publishedAt: "2024-08-12",
    description:
      "Drop-in Stripe Checkout, Payment Intents, and customer portal wired to RoyCSS form primitives.",
    longDescription:
      "The official RoyCSS Stripe plugin wraps Checkout, Payment Intents, and the Billing Portal behind a thin, typed API. It ships accessible payment forms built on RoyCSS input primitives, automatic currency formatting, idempotent webhook handling, and a test-mode toggle that mirrors Stripe's sandbox. Perfect for SaaS subscriptions, one-off purchases, and marketplaces.",
    gradient: "from-emerald-400 via-emerald-500 to-teal-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add stripe",
      "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in your .env",
      "Import createCheckoutSession from @roycss/plugin-stripe in your API route",
      "Mount the <StripeCheckoutButton /> component where you need a pay button",
    ],
    configExample: `// roycss.config.ts
import { defineConfig } from "roycss";
import stripe from "@roycss/plugin-stripe";

export default defineConfig({
  plugins: [
    stripe({
      mode: "test",            // "live" | "test"
      currency: "usd",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      successUrl: "/billing/success",
      cancelUrl: "/billing/cancel",
    }),
  ],
});`,
    compatibility: "RoyCSS ≥ 2.0.0",
    features: [
      "Typed Checkout Session factory",
      "Payment Intent + Setup Intent helpers",
      "Customer Portal deep-linking",
      "Webhook signature verification",
      "Test / live mode toggle",
    ],
    changelog: [
      {
        version: "v2.4.1",
        date: "2025-03-12",
        notes: "Patch — fixed token refresh race on long-running checkouts.",
      },
      {
        version: "v2.4.0",
        date: "2025-02-28",
        notes: "Minor — added webhook signature verification helper.",
      },
      {
        version: "v2.3.0",
        date: "2025-01-15",
        notes: "Major — moved to ESM-only; CommonJS consumers must migrate.",
      },
    ],
  },
  {
    id: "plugin-clerk",
    slug: "clerk",
    name: "Clerk",
    category: "Auth",
    version: "v3.1.0",
    weeklyDownloads: 142_870,
    rating: 4.8,
    verified: true,
    author: "Clerk Inc.",
    publishedAt: "2024-06-03",
    description:
      "Full-stack auth — sign-in, sign-up, MFA, organizations, and B2B SSO with prebuilt RoyCSS-styled components.",
    longDescription:
      "The Clerk plugin brings production-ready authentication to RoyCSS apps with zero config. It includes pre-styled <SignIn />, <SignUp />, and <UserProfile /> components that inherit your RoyCSS theme tokens, plus middleware helpers for route protection, organization switching, and B2B SSO. Supports passkeys, OAuth, and multi-factor authentication out of the box.",
    gradient: "from-violet-400 via-violet-500 to-fuchsia-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add clerk",
      "Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY",
      "Wrap your app in <ClerkProvider /> in the root layout",
      "Drop <SignIn /> / <SignUp /> on your auth routes",
    ],
    configExample: `// app/layout.tsx
import { ClerkProvider } from "@roycss/plugin-clerk";

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{ variables: { colorPrimary: "oklch(0.62 0.17 152)" } }}
    >
      {children}
    </ClerkProvider>
  );
}`,
    compatibility: "RoyCSS ≥ 1.8.0",
    features: [
      "Pre-styled sign-in / sign-up flows",
      "Passkey + OAuth + magic link",
      "Multi-factor authentication",
      "Organizations & B2B SSO",
      "Route-protection middleware",
    ],
    changelog: [
      {
        version: "v3.1.0",
        date: "2025-03-20",
        notes: "Minor — passkey enrollment now uses WebAuthn conditional UI.",
      },
      {
        version: "v3.0.2",
        date: "2025-02-09",
        notes: "Patch — org switcher no longer resets the active route.",
      },
      {
        version: "v3.0.0",
        date: "2024-12-04",
        notes: "Major — moved to app-router-first architecture.",
      },
    ],
  },
  {
    id: "plugin-supabase",
    slug: "supabase",
    name: "Supabase",
    category: "Database",
    version: "v2.8.4",
    weeklyDownloads: 221_540,
    rating: 4.9,
    verified: true,
    author: "Supabase Inc.",
    publishedAt: "2024-04-18",
    description:
      "Postgres, Auth, Storage, and Realtime in one typed client — with RoyCSS-styled admin scaffolds.",
    longDescription:
      "The Supabase plugin gives RoyCSS apps a typed Postgres client, row-level-security-aware auth, file storage, and realtime subscriptions. It includes a generator that scaffolds RoyCSS admin tables for any table in your schema, with sorting, filtering, and pagination wired in. Pair it with the Stripe plugin for a complete SaaS backend in minutes.",
    gradient: "from-teal-400 via-emerald-500 to-cyan-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add supabase",
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "Run npx roycss supabase scaffold to generate typed admin tables",
      "Import createClient from @roycss/plugin-supabase in server components",
    ],
    configExample: `// lib/supabase.ts
import { createClient } from "@roycss/plugin-supabase/server";

export const supabase = createClient({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  options: { auth: { persistSession: false } },
});`,
    compatibility: "RoyCSS ≥ 2.1.0",
    features: [
      "Typed Postgres query builder",
      "Row-level-security-aware auth",
      "Realtime subscriptions",
      "File storage with signed URLs",
      "Admin table scaffolding CLI",
    ],
    changelog: [
      {
        version: "v2.8.4",
        date: "2025-03-18",
        notes: "Patch — realtime reconnect now backs off exponentially.",
      },
      {
        version: "v2.8.0",
        date: "2025-02-14",
        notes: "Minor — added Postgres 16 array operators.",
      },
      {
        version: "v2.7.0",
        date: "2025-01-09",
        notes: "Minor — scaffold generator now emits RLS policies.",
      },
    ],
  },
  {
    id: "plugin-firebase",
    slug: "firebase",
    name: "Firebase",
    category: "Database",
    version: "v1.9.2",
    weeklyDownloads: 98_410,
    rating: 4.6,
    verified: true,
    author: "Google LLC",
    publishedAt: "2024-03-22",
    description:
      "Firestore, Auth, Storage, and Cloud Messaging with tree-shakeable modular imports.",
    longDescription:
      "The Firebase plugin wraps the modular Firebase v10 SDK into RoyCSS-friendly hooks and server utilities. It exposes typed Firestore helpers, a <FirebaseAuthProvider /> with offline persistence, file uploads with progress events, and Cloud Messaging for push notifications. Works in both app router server components and client islands.",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add firebase",
      "Paste your firebaseConfig into .env (prefixed with FIREBASE_)",
      "Initialize the app once in a server module",
      "Use the useFirestore() / useAuth() hooks in client components",
    ],
    configExample: `// lib/firebase.ts
import { initializeApp, getApps } from "@roycss/plugin-firebase/server";

export const firebaseApp =
  getApps().at(0) ??
  initializeApp({
    apiKey: process.env.FIREBASE_API_KEY!,
    projectId: process.env.FIREBASE_PROJECT_ID!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  });`,
    compatibility: "RoyCSS ≥ 1.5.0",
    features: [
      "Modular tree-shakeable imports",
      "Typed Firestore helpers",
      "Offline persistence for auth",
      "Storage uploads with progress",
      "Cloud Messaging push",
    ],
    changelog: [
      {
        version: "v1.9.2",
        date: "2025-03-09",
        notes: "Patch — fixed SSR hydration mismatch on auth provider.",
      },
      {
        version: "v1.9.0",
        date: "2025-02-01",
        notes: "Minor — added Firestore count() aggregate helper.",
      },
      {
        version: "v1.8.0",
        date: "2024-12-19",
        notes: "Minor — upgraded to Firebase v10.7 SDK.",
      },
    ],
  },
  {
    id: "plugin-auth0",
    slug: "auth0",
    name: "Auth0",
    category: "Auth",
    version: "v2.2.0",
    weeklyDownloads: 67_280,
    rating: 4.5,
    verified: true,
    author: "Okta Inc.",
    publishedAt: "2024-07-29",
    description:
      "Enterprise-grade OIDC auth with Universal Login, SAML bridges, and audience-scoped tokens.",
    longDescription:
      "The Auth0 plugin brings Okta-grade identity to RoyCSS apps. It supports Universal Login, OIDC + SAML federation, audience-scoped access tokens for API authorization, and a hosted user management console. Includes pre-styled <LoginButton /> and <LogoutButton /> components that follow the RoyCSS theme.",
    gradient: "from-orange-400 via-rose-500 to-fuchsia-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add auth0",
      "Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET",
      "Configure callback + logout URLs in your Auth0 tenant",
      "Wrap the app in <Auth0Provider /> and use the useAuth0() hook",
    ],
    configExample: `// app/layout.tsx
import { Auth0Provider } from "@roycss/plugin-auth0";

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <Auth0Provider
      domain={process.env.AUTH0_DOMAIN!}
      clientId={process.env.AUTH0_CLIENT_ID!}
      authorizationParams={{ redirect_uri: "/auth/callback" }}
    >
      {children}
    </Auth0Provider>
  );
}`,
    compatibility: "RoyCSS ≥ 1.8.0",
    features: [
      "Universal Login integration",
      "OIDC + SAML federation",
      "Audience-scoped access tokens",
      "Hosted user management",
      "Pre-styled login / logout buttons",
    ],
    changelog: [
      {
        version: "v2.2.0",
        date: "2025-03-04",
        notes: "Minor — added organization-scoped token helper.",
      },
      {
        version: "v2.1.1",
        date: "2025-01-22",
        notes: "Patch — silent renewal no longer fires on hidden tabs.",
      },
      {
        version: "v2.1.0",
        date: "2024-12-11",
        notes: "Minor — exposed PKCE verifier config.",
      },
    ],
  },
  {
    id: "plugin-mapbox",
    slug: "mapbox",
    name: "Mapbox",
    category: "Maps",
    version: "v3.0.1",
    weeklyDownloads: 54_120,
    rating: 4.7,
    verified: true,
    author: "Mapbox Inc.",
    publishedAt: "2024-09-14",
    description:
      "Interactive vector maps, geocoding, and turn-by-turn directions with RoyCSS-themed controls.",
    longDescription:
      "The Mapbox plugin embeds Mapbox GL JS into RoyCSS apps with theme-aware controls. It exposes a declarative <Map /> component, a useGeocode() hook for forward / reverse search, and a directions module with turn-by-turn instructions. All map chrome inherits RoyCSS semantic tokens so the map matches your app theme — no jarring default blue.",
    gradient: "from-amber-400 via-amber-500 to-orange-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add mapbox",
      "Set NEXT_PUBLIC_MAPBOX_TOKEN with your public access token",
      "Import the <Map /> component and pass a style URL",
      "Add <Marker /> / <Layer /> children declaratively",
    ],
    configExample: `// components/MapView.tsx
import { Map, Marker } from "@roycss/plugin-mapbox";

export function MapView({ lng, lat }: { lng: number; lat: number }) {
  return (
    <Map
      initialViewState={{ longitude: lng, latitude: lat, zoom: 12 }}
      style="mapbox://styles/roycss/semantics"
      style={{ height: 320, width: "100%" }}
    >
      <Marker longitude={lng} latitude={lat} />
    </Map>
  );
}`,
    compatibility: "RoyCSS ≥ 2.0.0",
    features: [
      "Declarative vector map component",
      "Forward + reverse geocoding",
      "Turn-by-turn directions",
      "Theme-aware map chrome",
      "Clustered marker layers",
    ],
    changelog: [
      {
        version: "v3.0.1",
        date: "2025-03-15",
        notes: "Patch — fixed RTL label flipping at zoom < 4.",
      },
      {
        version: "v3.0.0",
        date: "2025-02-10",
        notes: "Major — upgraded to Mapbox GL JS v3 (WebGL2 default).",
      },
      {
        version: "v2.5.0",
        date: "2024-11-30",
        notes: "Minor — added clustered marker layer helper.",
      },
    ],
  },
  {
    id: "plugin-chartjs",
    slug: "chartjs",
    name: "Chart.js",
    category: "Analytics",
    version: "v4.1.0",
    weeklyDownloads: 76_900,
    rating: 4.4,
    verified: false,
    author: "Chart.js OSS",
    publishedAt: "2024-05-07",
    description:
      "Canvas charts — line, bar, doughnut, scatter — themed with your RoyCSS color tokens.",
    longDescription:
      "The Chart.js plugin wraps the popular Chart.js library behind a declarative <Chart /> component that auto-themes axes, grids, and series to your RoyCSS palette. Supports line, bar, stacked, doughnut, radar, and scatter charts. Reduced-motion aware — disables entrance animations automatically when the user prefers reduced motion. Note: community-maintained, not officially verified.",
    gradient: "from-rose-400 via-rose-500 to-red-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add chartjs",
      "Import { Chart } from @roycss/plugin-chartjs",
      "Pass a type (\"line\" | \"bar\" | \"doughnut\") and a data prop",
      "Optionally override series colors with the theme prop",
    ],
    configExample: `// components/RevenueChart.tsx
import { Chart } from "@roycss/plugin-chartjs";

export function RevenueChart({ data }: { data: number[] }) {
  return (
    <Chart
      type="line"
      data={{
        labels: data.map((_, i) => \`Q\${i + 1}\`),
        datasets: [{ label: "Revenue", data, borderColor: "primary" }],
      }}
      options={{ animation: { duration: 600 } }}
    />
  );
}`,
    compatibility: "RoyCSS ≥ 1.4.0",
    features: [
      "Line / bar / doughnut / radar / scatter",
      "Auto-themed axes + grids",
      "Reduced-motion safe",
      "Container-query responsive",
      "OKLCH series palette",
    ],
    changelog: [
      {
        version: "v4.1.0",
        date: "2025-03-01",
        notes: "Minor — added container-query resize observer.",
      },
      {
        version: "v4.0.2",
        date: "2025-01-18",
        notes: "Patch — fixed legend click toggle on stacked bars.",
      },
      {
        version: "v4.0.0",
        date: "2024-11-22",
        notes: "Major — upgraded to Chart.js v4 (tree-shakeable).",
      },
    ],
  },
  {
    id: "plugin-tiptap",
    slug: "tiptap",
    name: "TipTap Editor",
    category: "Editor",
    version: "v2.6.0",
    weeklyDownloads: 89_330,
    rating: 4.8,
    verified: true,
    author: "TipTap GmbH",
    publishedAt: "2024-06-21",
    description:
      "Headless rich-text editor with RoyCSS-styled toolbar, slash commands, and markdown export.",
    longDescription:
      "The TipTap plugin bundles TipTap (built on ProseMirror) with a RoyCSS-themed floating toolbar, a slash-command menu, and extensions for tables, code blocks with syntax highlighting, and collaborative editing via Yjs. The editor is fully headless — you compose your own UI from RoyCSS primitives, or use the prebuilt <RichTextEditor /> for instant productivity.",
    gradient: "from-cyan-400 via-teal-500 to-emerald-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add tiptap",
      "Import { RichTextEditor } from @roycss/plugin-tiptap",
      "Pass an onChange callback to receive HTML / JSON",
      "Enable extensions: Table, CodeBlock, Link, Collaboration",
    ],
    configExample: `// components/Editor.tsx
import { RichTextEditor } from "@roycss/plugin-tiptap";
import { Table, CodeBlockLowlight, Link } from "@roycss/plugin-tiptap/ext";

export function Editor() {
  return (
    <RichTextEditor
      extensions={[Table, CodeBlockLowlight, Link]}
      placeholder="Start writing…"
      onChange={(html) => console.log(html)}
    />
  );
}`,
    compatibility: "RoyCSS ≥ 1.7.0",
    features: [
      "Headless ProseMirror core",
      "RoyCSS-themed floating toolbar",
      "Slash-command menu",
      "Tables, code blocks, links",
      "Yjs collaboration ready",
    ],
    changelog: [
      {
        version: "v2.6.0",
        date: "2025-03-22",
        notes: "Minor — added Yjs awareness cursor colors from theme.",
      },
      {
        version: "v2.5.1",
        date: "2025-02-05",
        notes: "Patch — fixed paste-of-images on Safari.",
      },
      {
        version: "v2.5.0",
        date: "2024-12-28",
        notes: "Minor — added CodeBlockLowlight extension.",
      },
    ],
  },
  {
    id: "plugin-uploadthing",
    slug: "uploadthing",
    name: "Uploadthing",
    category: "Uploads",
    version: "v6.2.3",
    weeklyDownloads: 61_780,
    rating: 4.5,
    verified: false,
    author: "Theo & Ping Labs",
    publishedAt: "2024-10-02",
    description:
      "Typed file uploads with drag-drop, progress, presigned URLs, and a RoyCSS-styled dropzone.",
    longDescription:
      "The Uploadthing plugin gives RoyCSS apps a typed file-upload pipeline — presigned URLs, multipart uploads for large files, virus scanning, and a <UploadDropzone /> component that inherits your theme. Includes server-side route handlers and a useUploadThing() hook for client islands. Note: community-maintained, not officially verified.",
    gradient: "from-pink-400 via-rose-500 to-fuchsia-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add uploadthing",
      "Set UPLOADTHING_SECRET and UPLOADTHING_APP_ID",
      "Create an API route at app/api/uploadthing/route.ts",
      "Drop <UploadDropzone endpoint=\"avatar\" /> in your form",
    ],
    configExample: `// app/api/uploadthing/route.ts
import { createRouteHandler } from "@roycss/plugin-uploadthing/server";
import { uploadRouter } from "./_router";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: { token: process.env.UPLOADTHING_SECRET! },
});`,
    compatibility: "RoyCSS ≥ 1.6.0",
    features: [
      "Typed file upload pipeline",
      "Presigned URLs + multipart",
      "Virus scanning",
      "RoyCSS-styled dropzone",
      "Progress events",
    ],
    changelog: [
      {
        version: "v6.2.3",
        date: "2025-03-11",
        notes: "Patch — fixed presigned URL expiry on slow networks.",
      },
      {
        version: "v6.2.0",
        date: "2025-02-18",
        notes: "Minor — added multipart uploads for files > 100 MB.",
      },
      {
        version: "v6.1.0",
        date: "2024-12-09",
        notes: "Minor — exposed virus-scan hook result.",
      },
    ],
  },
  {
    id: "plugin-resend",
    slug: "resend",
    name: "Resend",
    category: "Email",
    version: "v1.4.2",
    weeklyDownloads: 73_450,
    rating: 4.7,
    verified: true,
    author: "Resend Inc.",
    publishedAt: "2024-08-30",
    description:
      "Transactional email with React Email templates, RoyCSS-themed previews, and bounce webhooks.",
    longDescription:
      "The Resend plugin wraps the Resend API in a typed client and ships a set of React Email templates styled with RoyCSS tokens — welcome, password reset, receipt, and digest. Includes a local preview server so you can iterate on templates in your browser, plus bounce / delivery webhooks for production observability.",
    gradient: "from-fuchsia-400 via-purple-500 to-violet-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add resend",
      "Set RESEND_API_KEY in your .env",
      "Create a template at emails/welcome.tsx using RoyCSS primitives",
      "Send via resend.emails.send({ from, to, react })",
    ],
    configExample: `// emails/welcome.tsx
import { resend } from "@roycss/plugin-resend/server";
import WelcomeEmail from "./welcome";

export async function sendWelcome(to: string, name: string) {
  return resend.emails.send({
    from: "RoyCSS <hello@roycss.dev>",
    to,
    subject: "Welcome to RoyCSS",
    react: WelcomeEmail({ name }),
  });
}`,
    compatibility: "RoyCSS ≥ 1.9.0",
    features: [
      "Typed Resend API client",
      "React Email templates",
      "RoyCSS-themed previews",
      "Bounce / delivery webhooks",
      "Local preview server",
    ],
    changelog: [
      {
        version: "v1.4.2",
        date: "2025-03-19",
        notes: "Patch — fixed DKIM header canonicalization on replies.",
      },
      {
        version: "v1.4.0",
        date: "2025-02-12",
        notes: "Minor — added React Email template registry.",
      },
      {
        version: "v1.3.0",
        date: "2025-01-04",
        notes: "Minor — added bounce webhook handler.",
      },
    ],
  },
  {
    id: "plugin-posthog",
    slug: "posthog",
    name: "PostHog",
    category: "Analytics",
    version: "v3.2.0",
    weeklyDownloads: 84_610,
    rating: 4.8,
    verified: true,
    author: "PostHog Inc.",
    publishedAt: "2024-07-11",
    description:
      "Product analytics — events, funnels, feature flags, and session replay with consent-aware init.",
    longDescription:
      "The PostHog plugin brings product analytics to RoyCSS apps. It auto-captures page views and clicks, exposes typed capture() and identify() helpers, supports feature flags withRoyCSS-styled toggle UIs, and includes session replay for debugging UX issues. Consent-aware — defers initialization until the user accepts analytics cookies.",
    gradient: "from-rose-400 via-fuchsia-500 to-violet-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add posthog",
      "Set NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST",
      "Wrap the app in <PostHogProvider /> with consent gating",
      "Capture events via usePostHog().capture('event_name', props)",
    ],
    configExample: `// app/layout.tsx
import { PostHogProvider } from "@roycss/plugin-posthog";

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <PostHogProvider
      apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY!}
      options={{ persistence: "localStorage" }}
      consentGate={(consent) => consent.analytics}
    >
      {children}
    </PostHogProvider>
  );
}`,
    compatibility: "RoyCSS ≥ 2.0.0",
    features: [
      "Auto-capture page views + clicks",
      "Typed capture() / identify()",
      "Feature flags with UI toggle",
      "Session replay",
      "Consent-aware initialization",
    ],
    changelog: [
      {
        version: "v3.2.0",
        date: "2025-03-21",
        notes: "Minor — added feature-flag UI toggle component.",
      },
      {
        version: "v3.1.1",
        date: "2025-02-07",
        notes: "Patch — session replay no longer captures password fields.",
      },
      {
        version: "v3.1.0",
        date: "2024-12-22",
        notes: "Minor — added consent-gate prop to provider.",
      },
    ],
  },
  {
    id: "plugin-sentry",
    slug: "sentry",
    name: "Sentry",
    category: "Monitoring",
    version: "v7.0.0",
    weeklyDownloads: 112_890,
    rating: 4.9,
    verified: true,
    author: "Functional Software, Inc.",
    publishedAt: "2024-09-25",
    description:
      "Error monitoring + performance tracing with source maps, release tracking, and route-aware spans.",
    longDescription:
      "The Sentry plugin instruments RoyCSS apps for both error monitoring and performance. It captures unhandled exceptions, scopes errors to the current route + user, uploads source maps on build, and traces server-component data fetches as nested spans. Release tracking means you can tie regressions to a specific deploy in one click.",
    gradient: "from-orange-400 via-rose-500 to-fuchsia-600",
    installSteps: [
      "Run the CLI: npx roycss-cli plugin add sentry",
      "Set SENTRY_DSN, SENTRY_ORG, and SENTRY_PROJECT",
      "Wrap the root layout in <SentryProvider />",
      "Add sentry-cli upload to your build step for source maps",
    ],
    configExample: `// sentry.client.config.ts
import * as Sentry from "@roycss/plugin-sentry";

Sentry.init({
  dsn: process.env.SENTRY_DSN!,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
});`,
    compatibility: "RoyCSS ≥ 2.1.0",
    features: [
      "Error + performance instrumentation",
      "Route + user scoping",
      "Source map upload on build",
      "Server-component span tracing",
      "Release regression tracking",
    ],
    changelog: [
      {
        version: "v7.0.0",
        date: "2025-03-23",
        notes: "Major — upgraded to Sentry SDK v8 (new tracing engine).",
      },
      {
        version: "v6.4.0",
        date: "2025-02-15",
        notes: "Minor — added server-component span tracing.",
      },
      {
        version: "v6.3.1",
        date: "2025-01-12",
        notes: "Patch — fixed source map upload on Windows.",
      },
    ],
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Compact number formatting — 12840 → "12.8K", 1_200_000 → "1.2M". */
function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

/** Build the install command for a plugin slug. */
function buildInstallCommand(slug: string): string {
  return `npx roycss-cli plugin add ${slug}`;
}

/** Build the mock docs URL for a plugin id. */
function buildDocsUrl(id: string): string {
  return `${DOCS_URL_BASE}/${id}`;
}

// ═══════════════════════════════════════════════════════════════════════
// Clipboard hook — guarded copy with a transient "copied" flag
// ═══════════════════════════════════════════════════════════════════════

/**
 * Copy text to the clipboard, SSR-safe. Returns a tuple of
 * `[copied, copy]` where `copied` flips to `true` for `durationMs`
 * after a successful write.
 */
function useClipboard(durationMs = 2000): readonly [
  boolean,
  (text: string) => Promise<boolean>,
] {
  const [copied, setCopied] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending reset on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      // SSR / unsupported guard.
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== "function"
      ) {
        return false;
      }
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), durationMs);
        return true;
      } catch {
        return false;
      }
    },
    [durationMs],
  );

  return [copied, copy] as const;
}

// ═══════════════════════════════════════════════════════════════════════
// Stars — 5-star rating display with half-star support
// ═══════════════════════════════════════════════════════════════════════

interface StarsProps {
  /** 1–5, fractional values supported (e.g. 4.5). */
  value: number;
  /** Tailwind size class for each star, e.g. "size-3.5". */
  size?: string;
  /** Accessible label, defaults to "Rated X out of 5". */
  label?: string;
}

function Stars({ value, size = "size-3.5", label }: StarsProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(5, value));
  const pct = (clamped / 5) * 100;
  const aria = label ?? `Rated ${clamped.toFixed(1)} out of 5`;
  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle"
      role="img"
      aria-label={aria}
    >
      {/* Base layer — 5 muted stars */}
      <span className="relative inline-flex">
        <span className="flex text-foreground/20">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={`base-${i}`}
              className={cn(size, "fill-current")}
              strokeWidth={0}
              aria-hidden
            />
          ))}
        </span>
        {/* Overlay layer — 5 amber stars, clipped to rating width */}
        <span
          className="absolute inset-0 flex overflow-hidden text-amber-500"
          style={{ width: `${pct}%` }}
          aria-hidden
        >
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={`fill-${i}`}
              className={cn(size, "shrink-0 fill-current")}
              strokeWidth={0}
            />
          ))}
        </span>
      </span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PluginTile — the gradient icon square shown on cards + dialog header
// ═══════════════════════════════════════════════════════════════════════

interface PluginTileProps {
  plugin: Plugin;
  /** Size class for the tile, e.g. "size-10" or "size-16". */
  sizeClass?: string;
  /** Size class for the inner icon, e.g. "size-5" or "size-8". */
  iconSizeClass?: string;
  /** Show the verified badge overlay. */
  showVerified?: boolean;
}

function PluginTile({
  plugin,
  sizeClass = "size-10",
  iconSizeClass = "size-5",
  showVerified = true,
}: PluginTileProps): React.JSX.Element {
  const Icon = PLUGIN_ICON[plugin.id] ?? CATEGORY_META[plugin.category].icon;
  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
          plugin.gradient,
          sizeClass,
        )}
        aria-hidden
      >
        <Icon className={cn(iconSizeClass, "drop-shadow-sm")} strokeWidth={2} />
      </div>
      {showVerified && plugin.verified && (
        <BadgeCheck
          className={cn(
            "absolute -right-1 -bottom-1 size-4 rounded-full bg-background text-emerald-600 dark:text-emerald-400",
          )}
          aria-hidden
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CopyButton — reusable inline copy control with transient checkmark
// ═══════════════════════════════════════════════════════════════════════

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  size?: "default" | "sm" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  /** Accessible label — required when `size === "icon"` (no visible text). */
  ariaLabel?: string;
  /** Optional external "copied" state — otherwise uses internal hook. */
  externalCopied?: boolean;
  onCopy?: (text: string) => Promise<boolean> | boolean;
}

function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  size = "sm",
  variant = "outline",
  className,
  ariaLabel,
  externalCopied,
  onCopy,
}: CopyButtonProps): React.JSX.Element {
  const [internalCopied, internalCopy] = useClipboard();
  const copied = externalCopied ?? internalCopied;
  const handle = onCopy ?? internalCopy;

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={() => void handle(text)}
      className={cn("gap-1.5 tabular-nums", className)}
      aria-label={
        ariaLabel ?? (size === "icon" ? "Copy to clipboard" : undefined)
      }
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          {size !== "icon" && copiedLabel}
        </>
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden />
          {size !== "icon" && label}
        </>
      )}
    </Button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PluginCard — single card in the grid
// ═══════════════════════════════════════════════════════════════════════

interface PluginCardProps {
  plugin: Plugin;
  copied: boolean;
  onOpen: (plugin: Plugin) => void;
  onInstall: (plugin: Plugin) => void;
}

function PluginCard({
  plugin,
  copied,
  onOpen,
  onInstall,
}: PluginCardProps): React.JSX.Element {
  const meta = CATEGORY_META[plugin.category];
  const installCommand = buildInstallCommand(plugin.slug);
  const docsUrl = buildDocsUrl(plugin.id);

  return (
    <Card
      className={cn(
        "group h-full gap-0 overflow-hidden p-0 py-0",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-md",
      )}
    >
      {/* Top — tile + identity */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <button
          type="button"
          onClick={() => onOpen(plugin)}
          className="focus-visible:outline-none"
          aria-label={`View details for ${plugin.name}`}
        >
          <PluginTile plugin={plugin} sizeClass="size-12" iconSizeClass="size-6" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpen(plugin)}
              className="min-w-0 truncate text-left font-semibold leading-tight text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
              aria-label={`View details for ${plugin.name}`}
            >
              <span className="truncate">{plugin.name}</span>
            </button>
            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {plugin.version}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("shrink-0", meta.badge)}>
              {plugin.category}
            </Badge>
            {plugin.verified ? (
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                <BadgeCheck className="size-3" aria-hidden />
                Verified
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-border text-muted-foreground"
              >
                <Puzzle className="size-3" aria-hidden />
                Community
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {plugin.description}
        </p>
      </div>

      {/* Stats row */}
      <div className="mx-4 mt-3 flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Download className="size-3.5" aria-hidden />
          <span className="tabular-nums">{formatCompact(plugin.weeklyDownloads)}</span>
          <span className="sr-only">weekly downloads</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Stars value={plugin.rating} size="size-3.5" />
          <span className="tabular-nums">{plugin.rating.toFixed(1)}</span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 pt-3">
        <Button
          type="button"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onInstall(plugin)}
          aria-live="polite"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-300" aria-hidden />
              Copied!
            </>
          ) : (
            <>
              <Terminal className="size-3.5" aria-hidden />
              Install
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          asChild
        >
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open docs for ${plugin.name}`}
            className="gap-1.5"
          >
            <BookOpen className="size-3.5" aria-hidden />
            Docs
            <ExternalLink className="size-3 opacity-60" aria-hidden />
          </a>
        </Button>
      </div>

      {/* Hidden install command — available for screen readers / copy */}
      <span className="sr-only" aria-hidden>
        Install command: {installCommand}
      </span>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// StatCell — small labeled metric cell used in the detail dialog
// ═══════════════════════════════════════════════════════════════════════

interface StatCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCell({ icon, label, value }: StatCellProps): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CodeBlock — themed <pre><code> with a copy button overlay
// ═══════════════════════════════════════════════════════════════════════

interface CodeBlockProps {
  code: string;
  /** Optional filename / language label shown in the top-left. */
  label?: string;
}

function CodeBlock({ code, label }: CodeBlockProps): React.JSX.Element {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-muted/40">
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-1.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <Terminal className="size-3.5" aria-hidden />
          {label ?? "snippet"}
        </span>
        <CopyButton
          text={code}
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
        />
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PluginDetailDialog — full-detail view
// ═══════════════════════════════════════════════════════════════════════

interface PluginDetailDialogProps {
  plugin: Plugin | null;
  open: boolean;
  copied: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (plugin: Plugin) => void;
}

function PluginDetailDialog({
  plugin,
  open,
  copied,
  onOpenChange,
  onInstall,
}: PluginDetailDialogProps): React.JSX.Element | null {
  // The parent defers clearing `plugin` for 200ms after `open` flips to
  // false, so the close animation runs against the real data. The empty
  // shell below is only hit before any plugin has ever been opened.
  if (!plugin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl" />
      </Dialog>
    );
  }

  const meta = CATEGORY_META[plugin.category];
  const installCommand = buildInstallCommand(plugin.slug);
  const docsUrl = buildDocsUrl(plugin.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* Header band — gradient tint with the tile */}
        <div className="relative border-b bg-gradient-to-br from-muted/60 to-muted/20 p-5">
          <div className="flex items-start gap-4">
            <PluginTile
              plugin={plugin}
              sizeClass="size-16"
              iconSizeClass="size-8"
              showVerified={false}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl">{plugin.name}</DialogTitle>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {plugin.version}
                </span>
                {plugin.verified && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                  >
                    <BadgeCheck className="size-3" aria-hidden />
                    Verified
                  </Badge>
                )}
              </div>
              <DialogDescription className="mt-1">
                by{" "}
                <span className="font-medium text-foreground">{plugin.author}</span>
                {" · "}
                Published {plugin.publishedAt}
              </DialogDescription>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={meta.badge}>
                  <meta.icon className="size-3" aria-hidden />
                  {plugin.category}
                </Badge>
                <Badge variant="outline" className="text-foreground">
                  <Wrench className="size-3" aria-hidden />
                  {plugin.compatibility}
                </Badge>
              </div>
            </div>
          </div>
          <DialogClose
            className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </DialogClose>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 border-b p-5 sm:grid-cols-4">
          <StatCell
            icon={<Download className="size-4" aria-hidden />}
            label="Weekly"
            value={formatCompact(plugin.weeklyDownloads)}
          />
          <StatCell
            icon={<Star className="size-4 fill-amber-500 text-amber-500" aria-hidden />}
            label="Rating"
            value={`${plugin.rating.toFixed(1)} / 5`}
          />
          <StatCell
            icon={<Package className="size-4" aria-hidden />}
            label="Version"
            value={plugin.version}
          />
          <StatCell
            icon={<Wrench className="size-4" aria-hidden />}
            label="RoyCSS"
            value={plugin.compatibility.replace("RoyCSS ", "")}
          />
        </div>

        {/* Tabs — Overview / Install / Changelog */}
        <div className="flex max-h-[calc(90vh-19rem)] flex-col overflow-y-auto p-5">
          <Tabs defaultValue="overview" className="gap-4">
            <TabsList className="self-start">
              <TabsTrigger value="overview" className="gap-1.5">
                <BookOpen className="size-3.5" aria-hidden />
                Overview
              </TabsTrigger>
              <TabsTrigger value="install" className="gap-1.5">
                <Terminal className="size-3.5" aria-hidden />
                Install
              </TabsTrigger>
              <TabsTrigger value="changelog" className="gap-1.5">
                <History className="size-3.5" aria-hidden />
                Changelog
              </TabsTrigger>
            </TabsList>

            {/* ─── Overview tab ─────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Description
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {plugin.longDescription}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Features
                </h4>
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {plugin.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-hidden
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Compatibility
                </h4>
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Wrench className="size-3.5" aria-hidden />
                  {plugin.compatibility}
                  {" · "}
                  <span className="text-foreground">{plugin.category}</span>{" "}
                  category
                </p>
              </div>
            </TabsContent>

            {/* ─── Install tab ─────────────────────────────────────── */}
            <TabsContent value="install" className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Install command
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Copy this into your terminal at the root of your RoyCSS project.
                </p>
                <div className="mt-2 flex items-stretch gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                    <Terminal className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                      {installCommand}
                    </code>
                  </div>
                  <CopyButton text={installCommand} label="Copy" size="default" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Step-by-step
                </h4>
                <ol className="mt-2 space-y-2">
                  {plugin.installSteps.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span
                        className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary tabular-nums"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Configuration example
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Drop this into your RoyCSS config (or app entry) and adjust the
                  values for your environment.
                </p>
                <div className="mt-2">
                  <CodeBlock
                    code={plugin.configExample}
                    label="roycss.config.ts"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ─── Changelog tab ───────────────────────────────────── */}
            <TabsContent value="changelog" className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Recent releases
              </h4>
              <ol className="relative space-y-4 border-l pl-4">
                {plugin.changelog.map((entry) => (
                  <li key={entry.version} className="relative">
                    <span
                      className="absolute -left-[1.31rem] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background"
                      aria-hidden
                    />
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                        {entry.version}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {entry.date}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {entry.notes}
                    </p>
                  </li>
                ))}
              </ol>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              asChild
            >
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
              >
                <BookOpen className="size-4" aria-hidden />
                Docs
                <ExternalLink className="size-3.5 opacity-60" aria-hidden />
              </a>
            </Button>
            <Button
              onClick={() => onInstall(plugin)}
              className="gap-2"
              aria-live="polite"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-300" aria-hidden />
                  Copied!
                </>
              ) : (
                <>
                  <Terminal className="size-4" aria-hidden />
                  Copy install command
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PluginHub — main exported component
// ═══════════════════════════════════════════════════════════════════════

export function PluginHub(): React.JSX.Element {
  const { toast } = useToast();
  const [installCopiedId, setInstallCopiedId] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [sort, setSort] = useState<SortKey>("popular");
  const [active, setActive] = useState<Plugin | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // Clipboard for the top-level Install actions (card + dialog footer).
  // `installCopiedId` tracks which plugin's command was just copied so
  // the card + dialog footer buttons can reflect the transient state.
  const [, copyToClipboard] = useClipboard();

  // ─── Aggregate stats (memoized once — depends only on PLUGINS) ────
  const stats = useMemo(() => {
    const total = PLUGINS.length;
    const verified = PLUGINS.filter((p) => p.verified).length;
    const categories = new Set(PLUGINS.map((p) => p.category)).size;
    const totalDownloads = PLUGINS.reduce(
      (sum, p) => sum + p.weeklyDownloads,
      0,
    );
    return { total, verified, categories, totalDownloads };
  }, []);

  // ─── Filter + sort pipeline (memoized on every input) ───────────────
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = PLUGINS.filter((p) => {
      // Category
      if (category !== "All" && p.category !== category) return false;
      // Search — case-insensitive substring on name + description
      if (q.length > 0) {
        const haystack = `${p.name} ${p.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Copy before sort so we don't mutate the readonly source.
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "popular":
          return b.weeklyDownloads - a.weeklyDownloads;
        case "newest":
          // ISO date strings compare lexicographically — newer first.
          return b.publishedAt.localeCompare(a.publishedAt);
        case "rating":
          // Higher rating first; break ties by downloads.
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.weeklyDownloads - a.weeklyDownloads;
        default: {
          // Exhaustiveness guard — `sort` is a union of three literals,
          // so this branch is unreachable. Keeps TS happy without `any`.
          const _exhaustive: never = sort;
          void _exhaustive;
          return 0;
        }
      }
    });

    return sorted;
  }, [search, category, sort]);

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleOpen = useCallback((plugin: Plugin) => {
    setActive(plugin);
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Defer clearing so the close animation runs against the right data.
      window.setTimeout(() => setActive(null), 200);
    }
  }, []);

  const handleInstall = useCallback(
    async (plugin: Plugin) => {
      const command = buildInstallCommand(plugin.slug);
      const ok = await copyToClipboard(command);
      if (ok) {
        setInstallCopiedId(plugin.id);
        window.setTimeout(() => {
          setInstallCopiedId((current) =>
            current === plugin.id ? null : current,
          );
        }, 2000);
        toast({
          title: "Install command copied",
          description: command,
        });
      } else {
        // Clipboard write failed — still surface the command to the user.
        toast({
          title: "Install command",
          description: command,
        });
      }
    },
    [copyToClipboard, toast],
  );

  const hasFilters = search.trim().length > 0 || category !== "All";

  const resetFilters = useCallback(() => {
    setSearch("");
    setCategory("All");
    setSort("popular");
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Plug className="size-5 text-primary" aria-hidden />
          Roy Plugin Hub
        </CardTitle>
        <CardDescription>
          {stats.total} plugins · {stats.verified} verified ·{" "}
          {stats.categories} categories · Total downloads:{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatCompact(stats.totalDownloads)}
          </span>
        </CardDescription>
        <CardAction>
          <Badge variant="secondary" className="gap-1">
            <Package className="size-3" aria-hidden />
            {visible.length} shown
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {/* ─── Toolbar: search + sort ─────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plugins by name or description…"
              className="pl-9"
              aria-label="Search plugins"
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ArrowDownUp className="size-4 text-muted-foreground" aria-hidden />
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as SortKey)}
            >
              <SelectTrigger className="w-[180px]" aria-label="Sort plugins">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── Category chips ────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORY_ORDER.map((cat) => {
            const isActive = category === cat;
            const meta = cat === "All" ? null : CATEGORY_META[cat];
            const CatIcon = meta?.icon;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? meta
                      ? meta.chipActive
                      : "border-foreground/30 bg-foreground/10 text-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {CatIcon ? (
                  <CatIcon className="size-3.5" aria-hidden />
                ) : (
                  <Puzzle className="size-3.5" aria-hidden />
                )}
                {cat}
              </button>
            );
          })}
        </div>

        {/* ─── Grid ──────────────────────────────────────────────── */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                copied={installCopiedId === plugin.id}
                onOpen={handleOpen}
                onInstall={handleInstall}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">No plugins found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or category filter.
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <PluginDetailDialog
        plugin={active}
        open={dialogOpen}
        copied={active !== null && installCopiedId === active.id}
        onOpenChange={handleClose}
        onInstall={handleInstall}
      />
    </Card>
  );
}
