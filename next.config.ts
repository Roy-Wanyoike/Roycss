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
  typescript: {
    ignoreBuildErrors: true,
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
