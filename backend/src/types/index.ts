/**
 * Shared types for the RoyCSS backend.
 *
 * These types model both:
 *   - Entities persisted via Prisma (User, ContactMessage)
 *   - Domain objects read from the effects JSON (Effect, Recipe, Pattern)
 *
 * Centralizing them here keeps modules decoupled — a module imports
 * from `../../types/index.js` rather than reaching into another module.
 */
import type { EffectCategory, PreviewType } from "../modules/effects/schema.js";

/** Standard API response envelope. */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

/** Public-facing user (no passwordHash). */
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Contact message row. */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

/** Effect — full shape (cssCode optional since dist/effects.json omits it). */
export interface Effect {
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  tags: string[];
  cssCode?: string;
  previewType: PreviewType;
  childCount?: number | null;
  previewText?: string | null;
}

/** Recipe — curated effect combination. */
export interface Recipe {
  id: string;
  name: string;
  category: string;
  description: string;
  html: string;
  effectIds: string[];
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

/** Pattern — UX pattern built from effects. */
export interface Pattern {
  id: string;
  name: string;
  category: "states" | "feedback" | "layouts" | string;
  description: string;
  whenToUse: string;
  html: string;
  effectIds: string[];
  tags: string[];
}

/** Pagination helper. */
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Auth response. */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Themes ──────────────────────────────────────────────────────────────

/** Theme — color palette + design tokens for a RoyCSS deployment. */
export interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  /** Free-form token overrides (e.g. radius, spacing, typography). */
  tokens: Record<string, unknown>;
  createdAt: string; // ISO timestamp
}

// ─── Icons ───────────────────────────────────────────────────────────────

/** Icon category union. */
export type IconCategory =
  | "navigation"
  | "action"
  | "communication"
  | "media"
  | "files"
  | "user"
  | "status";

/** Icon — metadata only (SVG path lives in the front-end pack). */
export interface Icon {
  name: string;
  category: IconCategory;
  tags: string[];
  svgPath: string;
  strokeWidth: number;
  sizes: number[];
}

// ─── Academy ─────────────────────────────────────────────────────────────

/** Lesson — a single unit inside a learning path. */
export interface Lesson {
  id: string;
  title: string;
  type: "video" | "reading" | "lab" | "quiz";
  duration: number; // minutes
  completed: boolean;
}

/** LearningPath — ordered sequence of lessons toward a certification. */
export interface LearningPath {
  id: string;
  name: string;
  level: "Associate" | "Professional" | "Expert" | "Architect";
  lessons: Lesson[];
  duration: number; // total minutes
  price: number;
  certificationId: string;
}

// ─── Marketplace ─────────────────────────────────────────────────────────

/** Template — a publishable starter built on RoyCSS. */
export interface Template {
  id: string;
  name: string;
  category: string;
  price: number;
  author: string;
  downloads: number;
  rating: number;
  description: string;
  features: string[];
  thumbnail: string;
  createdAt: string; // ISO timestamp
}

/** Review — a buyer review attached to a template. */
export interface TemplateReview {
  id: string;
  templateId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO timestamp
}

// ─── Analytics ───────────────────────────────────────────────────────────

/** Analytics overview — top-line KPIs. */
export interface AnalyticsOverview {
  totalUsers: number;
  activeEffects: number;
  apiCalls: number;
  avgResponseTime: number; // ms
  totalUsersChange: number; // % vs previous window
  activeEffectsChange: number;
  apiCallsChange: number;
  avgResponseTimeChange: number;
}

/** TrafficDataPoint — single day of traffic. */
export interface TrafficDataPoint {
  date: string; // ISO date (yyyy-mm-dd)
  visitors: number;
  pageViews: number;
}

/** TopEffect — an effect with its usage stats. */
export interface TopEffect {
  id: string;
  name: string;
  category: string;
  uses: number;
  trend: number; // % change
}

/** DeviceBreakdown — share of traffic by device class. */
export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

/** GeoData — share of traffic by country (top N). */
export interface GeoData {
  country: string;
  code: string;
  visitors: number;
  share: number; // 0..1
}
