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
  // Issue #192: the security copy (FAQ, security/SECURITY-POLICY.md,
  // security/CSP.md) claims X-Frame-Options: DENY + HSTS — these headers
  // make the claims TRUE. XFO is belt-and-suspenders next to the prod CSP
  // `frame-ancestors 'none'` (src/proxy.ts); HSTS value matches the
  // documented claim exactly (browsers ignore it over plain HTTP, so dev
  // on localhost is unaffected; actual preload-list submission remains an
  // owner-side domain action).
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
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
