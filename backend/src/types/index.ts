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

// ─── Cloud ───────────────────────────────────────────────────────────────

/** Cloud project — a deployed RoyCSS site hosted on Roy Cloud. */
export interface CloudProject {
  id: string;
  name: string;
  status: "building" | "live" | "error" | "idle";
  url: string;
  lastDeployed: string; // ISO timestamp
  environment: "production" | "preview" | "staging";
  size: number; // bytes
}

/** Deployment — a single deploy run for a CloudProject. */
export interface Deployment {
  id: string;
  projectId: string;
  commit: string;
  branch: string;
  status: "queued" | "building" | "success" | "failed" | "canceled";
  duration: number; // ms
  timestamp: string; // ISO timestamp
}

// ─── DevTools ────────────────────────────────────────────────────────────

/** DevTools inspection result for a URL. */
export interface DevToolsResult {
  url: string;
  inspectedAt: string; // ISO timestamp
  classes: { name: string; count: number; source: string }[];
  tokens: { name: string; value: string }[];
  issues: { severity: "warn" | "error"; message: string; selector?: string }[];
}

// ─── Motion ──────────────────────────────────────────────────────────────

/** MotionEffect — a single animation in the Roy Motion library. */
export interface MotionEffect {
  id: string;
  name: string;
  category: "entrance" | "exit" | "loop" | "scroll" | "hover" | "gesture";
  duration: number; // ms
  easing: string;
  keyframes: string;
  cssCode: string;
}

// ─── Enterprise ──────────────────────────────────────────────────────────

/** Organization — a top-level enterprise customer. */
export interface Organization {
  id: string;
  name: string;
  plan: "team" | "business" | "enterprise";
  seats: number;
  seatsUsed: number;
  ownerId: string;
  createdAt: string; // ISO timestamp
}

/** Team — a sub-grouping inside an Organization. */
export interface Team {
  id: string;
  orgId: string;
  name: string;
  memberCount: number;
  createdAt: string; // ISO timestamp
}

/** License — a RoyCSS enterprise license seat. */
export interface License {
  id: string;
  orgId: string;
  type: "annual" | "perpetual" | "evaluation";
  status: "active" | "expired" | "revoked";
  seats: number;
  expiresAt: string; // ISO timestamp
}

/** AuditLogEntry — one enterprise audit event. */
export interface AuditLogEntry {
  id: string;
  orgId: string;
  actor: string;
  action: string;
  resource: string;
  ip: string;
  timestamp: string; // ISO timestamp
}

// ─── Inspector ───────────────────────────────────────────────────────────

/** InspectorClass — one roycss-* class with metadata. */
export interface InspectorClass {
  name: string;
  category: string;
  description: string;
  cssSnippet: string;
}

/** ScanResult — what the inspector found on a scanned page. */
export interface ScanResult {
  url: string;
  scannedAt: string; // ISO timestamp
  totalClasses: number;
  matched: { name: string; category: string; occurrences: number }[];
  unknown: string[];
}

// ─── Studio ──────────────────────────────────────────────────────────────

/** StudioProject — a visual builder project. */
export interface StudioProject {
  id: string;
  name: string;
  description: string;
  components: StudioComponent[];
  updatedAt: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

/** StudioComponent — one node in a Studio project tree. */
export interface StudioComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: StudioComponent[];
}

/** StudioTemplate — a starter template for Studio. */
export interface StudioTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  componentCount: number;
}

// ─── Pro Components ──────────────────────────────────────────────────────

/** ProComponent — a RoyCSS Pro component (DataGrid, Kanban, etc.). */
export interface ProComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  props: { name: string; type: string; required: boolean; description: string }[];
  codeSnippet: string;
}

// ─── MCP ─────────────────────────────────────────────────────────────────

/** MCPTool — one tool exposed by the RoyCSS MCP hub. */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  category: string;
}

/** MCPResource — a resource exposed by the MCP hub. */
export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/** MCPPrompt — a prompt template exposed by the MCP hub. */
export interface MCPPrompt {
  name: string;
  description: string;
  arguments: { name: string; description: string; required: boolean }[];
}
