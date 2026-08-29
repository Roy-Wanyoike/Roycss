// src/middleware.ts
//
// Generates a per-request Content-Security-Policy nonce and applies a strict
// production CSP that overrides the dev CSP set in next.config.ts `headers()`.
//
// In DEVELOPMENT (NODE_ENV !== "production"), this middleware is a no-op —
// the dev CSP from next.config.ts (with 'unsafe-inline' for HMR) applies.
//
// In PRODUCTION, the middleware:
//   1. Generates a 16-byte random nonce via the Web Crypto API.
//   2. Builds a strict CSP with `script-src 'self' 'nonce-{nonce}' 'strict-dynamic'`.
//   3. Sets the CSP on the response (overriding next.config.ts).
//   4. Sets `x-nonce` on the response so React Server Components can read it
//      via `next/headers` and apply it to <Script> tags. (Next.js 16 also
//      auto-applies the nonce to its own injected scripts when this header
//      is present.)
//
// See:
//   - docs/adr/07-security-supply-chain.md §2.2
//   - security/results/csp-production.txt
//   - Next.js CSP guide: https://nextjs.org/docs/app/guides/content-security-policy

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function buildProductionCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ") + ";";
}

/**
 * Generate a 16-byte random nonce, base64-encoded.
 * Uses the Web Crypto API (available in both Edge and Node runtimes).
 * 16 bytes = 128 bits of entropy, well above the 64-bit CSP nonce floor.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Convert to base64. Buffer is available in Node runtime; for Edge
  // runtime we fall back to a manual base64 encoder.
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  // Edge runtime fallback: btoa on a binary string
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function proxy(request: NextRequest): NextResponse {
  // In dev, do nothing — the dev CSP from next.config.ts applies.
  // Next.js sets NODE_ENV based on the script: `next dev` → "development",
  // `next build && next start` → "production".
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const nonce = generateNonce();
  const csp = buildProductionCsp(nonce);

  // Clone the request headers into the response so Next.js's own
  // middleware pipeline (which sets nonce on <Script> tags) can read it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Set the CSP + nonce on the RESPONSE as well (this is what the browser
  // actually reads). next.config.ts `headers()` already set a dev CSP;
  // we override it here.
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  // Run middleware on every route except static assets and Next.js internals.
  matcher: [
    /*
     * Match all request paths except:
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /_next/media (next/font self-hosted fonts)
     * - /favicon.ico, /apple-icon.png, /logo.svg, etc. (public assets)
     * - /roycss-source.zip, /RoyCSS.zip (public downloadables)
     */
    "/((?!_next/static|_next/image|_next/media|favicon\\.png|apple-icon\\.png|logo\\.svg|roycss-logo-.*|RoyCSS\\.zip|roycss-source\\.zip|images/|robots\\.txt).*)",
  ],
};
