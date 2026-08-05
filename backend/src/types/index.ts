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
