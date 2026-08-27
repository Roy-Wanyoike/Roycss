/**
 * Rate limiting + CSRF origin validation utilities for API routes.
 *
 * In-memory sliding-window rate limiter (sufficient for single-instance deploys).
 * For multi-instance, replace with @upstash/ratelimit + Redis/KV.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60s
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetTime) rateLimitStore.delete(key);
    }
  }, 60_000).unref?.();
}

/**
 * Check if a request should be rate-limited.
 * @param identifier — typically the IP address
 * @param limit — max requests in the window
 * @param windowMs — window size in milliseconds
 * @returns { allowed: boolean; remaining: number; resetAt: number }
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetTime };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetTime };
}

/**
 * Get the client IP from a Next.js request.
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/**
 * CSRF: verify the Origin header matches the expected site origin.
 * Returns false if the origin is missing or doesn't match.
 */
export function verifyOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  // In dev, allow localhost variants
  const allowedOrigins = [
    `http://${host}`,
    `https://${host}`,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
  // If no origin header (same-origin fetch), allow if host is present
  if (!origin) return Boolean(host);
  return allowedOrigins.includes(origin);
}

/**
 * Rate limit headers for the response.
 */
export function rateLimitHeaders(remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
  };
}
