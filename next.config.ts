import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self' *; frame-src https://github.com https://*.github.com;",
  },
];

const nextConfig: NextConfig = {
  // `output: "standalone"` is only needed for self-hosted deployments
  // (Docker / bare metal — see build:standalone + start:standalone scripts).
  // Vercel deploys with its first-class Next.js adapter and does NOT need
  // (or support) standalone output — vercel.json intentionally has no
  // buildCommand/outputDirectory overrides so the adapter stays in control.
  output: process.env.SELF_HOST === "1" ? "standalone" : undefined,
  // Type validation stays ON during `next build` (issue #167): the separate
  // `bunx tsc --noEmit` gate is not a substitute — a merged build must never
  // skip type-checking. See docs/CONTRIBUTING.md for the build memory floor.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  async redirects() {
    return [
      // Issue #187: /docs used to serve a 200 meta-refresh shell (the
      // static-page redirect() fallback) with the home title — a real
      // indexing hazard. A config-level redirect answers BEFORE routing,
      // so crawlers get a true permanent redirect. The page.tsx fallback
      // at src/app/docs/page.tsx stays as a harmless second layer (it is
      // unreachable once this rule is active).
      {
        source: "/docs",
        destination: "/docs/getting-started",
        permanent: true, // 308 — preserve method, cache at the edge
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
