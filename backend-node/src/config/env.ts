/**
 * Environment variable loading and validation with Zod.
 *
 * Loads process.env, validates it, and exposes a typed `env` object.
 * Throws on first boot if required vars are missing or malformed so
 * the server fails fast instead of running in a broken state.
 */
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000")
    .transform((s) =>
      s
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    ),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_GENERAL: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_MAX_AUTH: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_MAX_CONTACT: z.coerce.number().int().positive().default(5),
  // ─── Per-route rate-limit tiers (PF-009 / issue #94 A5) ───────────
  RATE_LIMIT_MAX_AI: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_MAX_SEARCH: z.coerce.number().int().positive().default(60),

  // ─── Per-API-key rate limiting (issue #65) ──────────────────────
  API_KEY_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  API_KEY_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60_000),

  EFFECTS_DATA_PATH: z.string().default("../dist/effects.json"),

  // ─── Transactional email (PF-011 / audit F-02) ─────────────────────
  // APP_URL is the canonical frontend origin used to build emailed
  // action links (verify-email, reset-password). MAIL_FROM is the
  // Resend sender identity (must be a verified Resend domain in prod).
  APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .transform((s) => s.replace(/\/$/, "")),
  MAIL_FROM: z.string().default("RoyCSS <onboarding@resend.dev>"),

  // ─── Supabase (production) ────────────────────────────────────────
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),

  // ─── External service keys ────────────────────────────────────────
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  CDN_API_TOKEN: z.string().optional(),
  CDN_PROVIDER: z.string().optional(),
  FIGMA_TOKEN: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  NPM_TOKEN: z.string().optional(),
});

// ─── Production-only JWT secret hardening (audit F-15) ─────────────────────
// The 16-char floor above invites weak prod secrets. When NODE_ENV=production
// we additionally require ≥48 chars and reject known placeholder values
// (the ones shipped in .env.example / test fixtures). Dev and test keep the
// lenient floor so local setups and the 32-char test secrets keep working.
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  "change-me",
  "jwt-secret",
  "super-secret",
  "your-secret-key",
  "your-256-bit-secret",
  // .env.example values (long enough to pass the length check on purpose —
  // they must still be rejected):
  "change-me-in-production-please-use-a-64-char-random-string",
  "change-me-too-different-from-jwt-secret-64-chars",
]);

function looksLikePlaceholderSecret(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (KNOWN_PLACEHOLDER_SECRETS.has(v)) return true;
  // Heuristics for placeholder-ish prefixes: "change-me*", "test*",
  // "dev*", "dummy*", "example*", "placeholder*", "your*secret*", …
  return /^(change[-_ ]?me|test|dev|dummy|example|placeholder|your|my)([-_ ]|$)/.test(
    v,
  );
}

const EnvSchemaWithProdRules = EnvSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;
  for (const key of ["JWT_SECRET", "JWT_REFRESH_SECRET"] as const) {
    const value = env[key];
    if (value.length < 48) {
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: `${key} must be at least 48 characters in production (got ${value.length}) — generate one with \`openssl rand -base64 48\``,
      });
      continue;
    }
    if (looksLikePlaceholderSecret(value)) {
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: `${key} looks like a placeholder value — set a real random secret for production (e.g. \`openssl rand -base64 48\`)`,
      });
    }
  }
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

/**
 * Parse and validate environment variables.
 * Cached after first call — subsequent calls return the same instance.
 */
export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = EnvSchemaWithProdRules.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(
      `[env] Invalid environment configuration:\n${issues}\n\n` +
        `See backend/.env.example for the expected shape.`,
    );
    process.exit(1);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/** Convenience accessor — loads on first use. */
export const env: Env = new Proxy({} as Env, {
  get(_t, prop: string) {
    return (loadEnv() as Record<string, unknown>)[prop];
  },
});
