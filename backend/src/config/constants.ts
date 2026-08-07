/**
 * Static, derived constants for the backend.
 *
 * Anything that depends on env values should live here so the rest of the
 * codebase can import a single `constants` object instead of recomputing
 * the same values everywhere.
 */
import { env } from "./env.js";

export const IS_PROD = env.NODE_ENV === "production";
export const IS_DEV = env.NODE_ENV === "development";
export const IS_TEST = env.NODE_ENV === "test";

export const APP_NAME = "roycss-backend";
export const APP_VERSION = "1.0.0";

/** API version mounted at /api/v1 */
export const API_PREFIX = "/api/v1";

/** CORS — Origins from env plus safe localhost defaults. */
export const CORS_ORIGINS: string[] = env.CORS_ORIGINS;

/** Rate limit windows (in ms). */
export const RATE_LIMIT = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  general: env.RATE_LIMIT_MAX_GENERAL,
  auth: env.RATE_LIMIT_MAX_AUTH,
  contact: env.RATE_LIMIT_MAX_CONTACT,
} as const;

/** JWT lifetimes — passed straight to jsonwebtoken. */
export const JWT_CONFIG = {
  secret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  issuer: APP_NAME,
  audience: "roycss-client",
} as const;

/** Cache TTLs (ms). */
export const CACHE_TTL = {
  effectsList: 5 * 60 * 1000, // 5 min
  effectDetail: 10 * 60 * 1000, // 10 min
  recipesList: 5 * 60 * 1000,
  recipeDetail: 10 * 60 * 1000,
  patternsList: 5 * 60 * 1000,
  patternDetail: 10 * 60 * 1000,
  themesList: 10 * 60 * 1000, // 10 min
  themeDetail: 10 * 60 * 1000,
  iconsList: 10 * 60 * 1000,
  iconDetail: 10 * 60 * 1000,
  pathsList: 5 * 60 * 1000,
  pathDetail: 5 * 60 * 1000,
  templatesList: 5 * 60 * 1000,
  templateDetail: 5 * 60 * 1000,
  analytics: 5 * 60 * 1000,
} as const;

/** LRU cache size ceiling. */
export const CACHE_MAX_ENTRIES = 1000;

/** Standard pagination defaults. */
export const PAGINATION = {
  defaultLimit: 24,
  maxLimit: 200,
} as const;

/** Contact form field length limits (mirror of src/app/api/contact/route.ts). */
export const CONTACT_LIMITS = {
  name: 120,
  email: 160,
  subject: 160,
  message: 5000,
  messageMin: 10,
} as const;

/** Path to the effects JSON emitted by the parent project's build. */
export const EFFECTS_DATA_PATH = env.EFFECTS_DATA_PATH;
