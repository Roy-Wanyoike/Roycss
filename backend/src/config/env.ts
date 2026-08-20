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

  EFFECTS_DATA_PATH: z.string().default("../dist/effects.json"),

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

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

/**
 * Parse and validate environment variables.
 * Cached after first call — subsequent calls return the same instance.
 */
export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
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
