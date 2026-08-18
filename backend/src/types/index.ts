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

// ─── Compliance ──────────────────────────────────────────────────────────

/** ComplianceStandard — an accessibility regulation / guideline. */
export interface ComplianceStandard {
  id: string;
  name: string;
  /** Short code (e.g. "WCAG2.2-AA"). */
  code: string;
  level: "A" | "AA" | "AAA" | "—";
  description: string;
  criteriaCount: number;
  region: string;
}

/** ComplianceFinding — one violation found during a scan. */
export interface ComplianceFinding {
  criterion: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  element: string;
  message: string;
  remediation: string;
}

/** ComplianceScanResult — output of a single compliance scan. */
export interface ComplianceScanResult {
  id: string;
  url: string;
  standardId: string;
  standardName: string;
  scannedAt: string; // ISO timestamp
  score: number; // 0..100
  status: "pass" | "warn" | "fail";
  findings: ComplianceFinding[];
  summary: { critical: number; serious: number; moderate: number; minor: number };
}

/** ComplianceReport — aggregated compliance report. */
export interface ComplianceReport {
  id: string;
  name: string;
  generatedAt: string; // ISO timestamp
  projectsScanned: number;
  averageScore: number;
  topIssues: { criterion: string; occurrences: number }[];
}

// ─── Audit Center ────────────────────────────────────────────────────────

/** AuditProject — a project under Roy Audit Center monitoring. */
export interface AuditProject {
  id: string;
  name: string;
  url: string;
  score: number; // 0..100
  status: "passing" | "warning" | "failing";
  lastAudit: string; // ISO timestamp
  categories: { name: string; score: number }[];
}

/** AuditIssue — a single audit issue. */
export interface AuditIssue {
  id: string;
  projectId: string;
  title: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  category: string;
  status: "open" | "in-progress" | "resolved";
  detectedAt: string; // ISO timestamp
}

/** AuditTrendPoint — one month of audit trend data. */
export interface AuditTrendPoint {
  month: string; // e.g. "2025-01"
  score: number;
  issues: number;
}

// ─── Fleet ───────────────────────────────────────────────────────────────

/** FleetProject — a monitored site in the Roy Fleet. */
export interface FleetProject {
  id: string;
  name: string;
  url: string;
  healthScore: number; // 0..100
  status: "healthy" | "degraded" | "critical" | "offline";
  uptime: number; // % over last 30d
  lastCheck: string; // ISO timestamp
  region: string;
}

/** FleetHealth — fleet-wide health summary. */
export interface FleetHealth {
  total: number;
  healthy: number;
  degraded: number;
  critical: number;
  offline: number;
  averageScore: number;
  uptime: number;
}

// ─── Workspace ───────────────────────────────────────────────────────────

/** WorkspaceResourceItem — a single resource inside a workspace category. */
export interface WorkspaceResourceItem {
  id: string;
  name: string;
  description: string;
  updatedAt: string; // ISO timestamp
}

/** WorkspaceResourceType — one resource category with items. */
export interface WorkspaceResourceType {
  type: string;
  label: string;
  count: number;
  items: WorkspaceResourceItem[];
}

/** WorkspaceTeamMember — a workspace team member. */
export interface WorkspaceTeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  avatar: string;
  lastActive: string; // ISO timestamp
}

// ─── Deploy ──────────────────────────────────────────────────────────────

/** DeployPlatform — a deployment platform integration. */
export interface DeployPlatform {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  regions: string[];
  features: string[];
}

/** DeployEnvironment — a configured deployment environment. */
export interface DeployEnvironment {
  id: string;
  name: string;
  branch: string;
  platformId: string;
  url: string;
  autoDeploy: boolean;
}

/** DeployHistoryEntry — one deployment in the deploy history. */
export interface DeployHistoryEntry {
  id: string;
  projectId: string;
  environment: string;
  platform: string;
  status: "queued" | "building" | "success" | "failed" | "canceled";
  commit: string;
  branch: string;
  duration: number; // ms
  timestamp: string; // ISO timestamp
  url: string;
}

// ─── Preview ─────────────────────────────────────────────────────────────

/** PreviewBranch — a preview deployment for a git branch. */
export interface PreviewBranch {
  id: string;
  branch: string;
  project: string;
  url: string;
  status: "building" | "ready" | "error" | "expired";
  commit: string;
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
}

// ─── CDN ─────────────────────────────────────────────────────────────────

/** CDNStats — top-line CDN metrics. */
export interface CDNStats {
  requests: number;
  bandwidth: number; // bytes
  hitRate: number; // 0..1
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number; // ms
  window: "24h" | "7d" | "30d";
}

/** CDNResource — a single CDN-tracked resource. */
export interface CDNResource {
  id: string;
  path: string;
  type: "asset" | "image" | "font" | "document" | "video";
  size: number; // bytes
  hits: number;
  edgeHits: number;
  lastAccessed: string; // ISO timestamp
}

/** CDNEdge — one edge location. */
export interface CDNEdge {
  id: string;
  city: string;
  country: string;
  code: string;
  latency: number; // ms
  requests: number;
  status: "online" | "degraded" | "offline";
}

// ─── Storage ─────────────────────────────────────────────────────────────

/** StorageFile — a single file in Roy Storage. */
export interface StorageFile {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "audio" | "archive" | "other";
  size: number; // bytes
  mimeType: string;
  url: string;
  uploadedAt: string; // ISO timestamp
}

/** StorageUsage — storage quota and usage. */
export interface StorageUsage {
  used: number;
  quota: number;
  unit: "bytes";
  fileCount: number;
  byType: { type: string; size: number }[];
}

// ─── Edge ────────────────────────────────────────────────────────────────

/** EdgeRegion — a single edge region. */
export interface EdgeRegion {
  id: string;
  name: string;
  city: string;
  country: string;
  code: string;
  latency: number; // ms
  status: "active" | "syncing" | "disabled";
  requests24h: number;
}

/** EdgeConfig — edge function / cache config. */
export interface EdgeConfig {
  defaultTtl: number; // seconds
  cacheStrategy: "cache-first" | "stale-while-revalidate" | "network-first";
  purgeOnDeploy: boolean;
  customHeaders: Record<string, string>;
}

/** EdgePerformancePoint — one comparison data point. */
export interface EdgePerformancePoint {
  region: string;
  edgeLatency: number; // ms
  originLatency: number; // ms
  improvement: number; // %
}

// ─── Mentor ──────────────────────────────────────────────────────────────

/** MentorTopic — one learning topic in Roy Mentor. */
export interface MentorTopic {
  id: string;
  title: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  lessonCount: number;
}

/** MentorLevel — one skill level track. */
export interface MentorLevel {
  id: string;
  name: string;
  description: string;
  xpRequired: number;
  unlocks: string[];
}

/** MentorProgress — learner progress snapshot. */
export interface MentorProgress {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  completedTopics: number;
  totalTopics: number;
  recentActivity: { topicId: string; title: string; ts: string }[];
}

/** MentorChatMessage — one message in a mentor chat session. */
export interface MentorChatMessage {
  role: "user" | "mentor";
  content: string;
  ts: string; // ISO timestamp
}

// ─── Challenges ──────────────────────────────────────────────────────────

/** Challenge — a coding challenge in Roy Challenges. */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  category: string;
  timeLimit: number; // minutes
  participants: number;
  completionRate: number; // 0..1
  xpReward: number;
}

/** ChallengeLeaderboardEntry — one row on the leaderboard. */
export interface ChallengeLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  solved: number;
  totalTime: number; // ms
  avatar: string;
}

// ─── Certifications ──────────────────────────────────────────────────────

/** Certification — a certification offered by Roy Academy. */
export interface Certification {
  id: string;
  name: string;
  level: "Associate" | "Professional" | "Expert" | "Architect";
  description: string;
  price: number;
  duration: number; // minutes (exam duration)
  passingScore: number; // 0..100
  topicCount: number;
}

/** EarnedCertification — a certification earned by a user. */
export interface EarnedCertification {
  id: string;
  certificationId: string;
  userId: string;
  userName: string;
  score: number;
  issuedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
  verifyCode: string;
}

/** ExamQuestion — a single question in an exam. */
export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ─── Accessibility ───────────────────────────────────────────────────────

/** Accessibility WCAG rule. */
export interface WCAGRule {
  id: string;
  principle: string;
  guideline: string;
  level: "A" | "AA" | "AAA";
  description: string;
  category: string;
}

/** Accessibility audit result for a URL. */
export interface AccessibilityAudit {
  id: string;
  url: string;
  scannedAt: string; // ISO timestamp
  score: number; // 0..100
  level: "A" | "AA" | "AAA";
  violations: {
    ruleId: string;
    severity: "critical" | "serious" | "moderate" | "minor";
    selector: string;
    message: string;
  }[];
  passes: number;
  summary: string;
}

/** Contrast ratio result for two colors. */
export interface ContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  AA: { normal: boolean; large: boolean };
  AAA: { normal: boolean; large: boolean };
}

// ─── Architect ───────────────────────────────────────────────────────────

/** Architecture template — reusable Roy Architect template. */
export interface ArchitectureTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  stack: string[];
  layers: string[];
  diagram: string;
  createdAt: string; // ISO timestamp
}

/** Architecture generation result. */
export interface ArchitectureResult {
  id: string;
  prompt: string;
  templateId: string;
  status: "queued" | "generating" | "complete" | "failed";
  components: { name: string; type: string; responsibility: string }[];
  connections: { from: string; to: string; protocol: string }[];
  recommendations: string[];
  createdAt: string; // ISO timestamp
}

// ─── Review ──────────────────────────────────────────────────────────────

/** Review rule — code-review rule used by Roy Review. */
export interface ReviewRule {
  id: string;
  name: string;
  category: "performance" | "accessibility" | "security" | "best-practice" | "maintainability";
  severity: "info" | "warning" | "error";
  description: string;
  language: string;
}

/** Review result — output of a code review. */
export interface ReviewResult {
  id: string;
  filename: string;
  language: string;
  status: "pending" | "complete" | "failed";
  score: number; // 0..100
  findings: {
    ruleId: string;
    severity: "info" | "warning" | "error";
    line: number;
    message: string;
    suggestion?: string;
  }[];
  summary: string;
  createdAt: string; // ISO timestamp
}

// ─── Refactor ────────────────────────────────────────────────────────────

/** Source framework — a CSS framework Roy Refactor can migrate from. */
export interface SourceFramework {
  id: string;
  name: string;
  version: string;
  popularity: number; // 0..100
  migrationPath: string;
  notes: string;
}

/** Refactor result — output of a refactor transformation. */
export interface RefactorResult {
  id: string;
  sourceFramework: string;
  targetFramework: string;
  status: "queued" | "in-progress" | "complete" | "failed";
  filesProcessed: number;
  classesMigrated: number;
  classesUnmapped: number;
  beforeSize: number; // bytes
  afterSize: number; // bytes
  diff: string;
  createdAt: string; // ISO timestamp
}

// ─── Pair ────────────────────────────────────────────────────────────────

/** Pair chat message. */
export interface PairMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO timestamp
}

/** Pair chat session. */
export interface PairSession {
  id: string;
  title: string;
  language: string;
  messages: PairMessage[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/** Pair suggestion — proactive Roy Pair suggestion. */
export interface PairSuggestion {
  id: string;
  title: string;
  description: string;
  category: "refactor" | "test" | "performance" | "security" | "style";
  language: string;
  codeSnippet: string;
}

// ─── Designer ────────────────────────────────────────────────────────────

/** Design preset — Roy Designer preset. */
export interface DesignPreset {
  id: string;
  name: string;
  style: string;
  category: string;
  palette: string[];
  typography: { fontFamily: string; scale: number };
  radius: string;
  spacing: string;
}

/** Designer result — AI-generated design. */
export interface DesignerResult {
  id: string;
  prompt: string;
  presetId: string;
  status: "queued" | "generating" | "complete" | "failed";
  components: { name: string; type: string; html: string; css: string }[];
  tokens: Record<string, string>;
  createdAt: string; // ISO timestamp
}

// ─── Scaffold ────────────────────────────────────────────────────────────

/** Project type — a Roy Scaffold project type. */
export interface ProjectType {
  id: string;
  name: string;
  description: string;
  category: "web" | "mobile" | "desktop" | "library" | "server";
  defaultFramework: string;
  features: string[];
}

/** Scaffold framework — a framework Roy Scaffold can target. */
export interface ScaffoldFramework {
  id: string;
  name: string;
  version: string;
  language: "typescript" | "javascript";
  runtime: "node" | "deno" | "bun" | "browser";
  popularity: number;
}

/** Scaffold result — output of a scaffold generation. */
export interface ScaffoldResult {
  id: string;
  projectType: string;
  framework: string;
  name: string;
  status: "queued" | "generating" | "complete" | "failed";
  files: { path: string; content: string }[];
  dependencies: { name: string; version: string }[];
  createdAt: string; // ISO timestamp
}

// ─── Generator ───────────────────────────────────────────────────────────

/** Generation type — a kind of code Roy Generator can produce. */
export interface GenerationType {
  id: string;
  name: string;
  description: string;
  inputs: string[];
  languages: string[];
  output: string;
}

/** Generator template — code template for a generation type. */
export interface GeneratorTemplate {
  id: string;
  typeId: string;
  name: string;
  language: string;
  framework: string;
  code: string;
  variables: string[];
}

/** Generator result — output of code generation. */
export interface GeneratorResult {
  id: string;
  typeId: string;
  name: string;
  language: string;
  status: "queued" | "generating" | "complete" | "failed";
  files: { path: string; content: string }[];
  createdAt: string; // ISO timestamp
}

// ─── Sync ────────────────────────────────────────────────────────────────

/** Sync integration status. */
export interface SyncIntegrationStatus {
  id: string;
  service: "figma" | "github" | "tokens" | "adobe-xd";
  status: "connected" | "disconnected" | "error" | "syncing";
  lastSync: string | null; // ISO timestamp
  resourceCount: number;
}

/** Sync history entry. */
export interface SyncHistoryEntry {
  id: string;
  service: "figma" | "github" | "tokens" | "adobe-xd";
  status: "success" | "failed" | "partial" | "in-progress";
  resourceType: string;
  resourceCount: number;
  duration: number; // ms
  message: string;
  timestamp: string; // ISO timestamp
}

// ─── Version ─────────────────────────────────────────────────────────────

/** Changelog entry — one RoyCSS release. */
export interface ChangelogEntry {
  version: string;
  date: string; // ISO date
  type: "major" | "minor" | "patch";
  highlights: string[];
  changes: { type: "added" | "changed" | "deprecated" | "removed" | "fixed" | "security"; description: string }[];
}

/** Breaking change — one breaking change between two versions. */
export interface BreakingChange {
  id: string;
  version: string;
  title: string;
  description: string;
  migration: string;
  severity: "low" | "medium" | "high";
}

/** Upgrade check result. */
export interface UpgradeCheckResult {
  current: string;
  latest: string;
  upgradeAvailable: boolean;
  breakingChanges: number;
  recommendation: "upgrade" | "review" | "skip";
  notes: string;
}

// ─── Registry ────────────────────────────────────────────────────────────

/** Registry package — a RoyCSS-related npm package. */
export interface RegistryPackage {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  latestVersion: string;
  downloads: number;
  rating: number;
  tags: string[];
  license: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/** Package version history entry. */
export interface PackageVersion {
  version: string;
  publishedAt: string; // ISO timestamp
  downloads: number;
  size: number; // bytes
  deprecated: boolean;
  readme: string;
}

// ─── Governance ──────────────────────────────────────────────────────────

/** Governance approval — a pending request awaiting review. */
export interface GovernanceApproval {
  id: string;
  type: "publish" | "delete" | "feature-flag" | "deployment" | "configuration";
  resource: string;
  requester: string;
  reviewer: string | null;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  reason: string;
  risk: "low" | "medium" | "high";
  createdAt: string; // ISO timestamp
  decidedAt: string | null; // ISO timestamp
}

/** Governance policy — a documented rule. */
export interface GovernancePolicy {
  id: string;
  name: string;
  category: "deployment" | "security" | "content" | "access" | "compliance";
  description: string;
  enforcement: "automatic" | "manual" | "advisory";
  severity: "info" | "warning" | "blocking";
}

/** Governance audit log entry. */
export interface GovernanceAuditEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  result: "success" | "failure";
  ip: string;
  timestamp: string; // ISO timestamp
}

// ─── Open ────────────────────────────────────────────────────────────────

/** GoodFirstIssue — an open-source issue tagged "good-first-issue". */
export interface GoodFirstIssue {
  id: string;
  title: string;
  repo: string;
  labels: string[];
  assignee: string | null;
  comments: number;
  url: string;
  createdAt: string; // ISO timestamp
}

/** RFC — a request-for-comments proposal under discussion. */
export interface RFC {
  id: string;
  title: string;
  status: "draft" | "open" | "accepted" | "rejected" | "withdrawn";
  author: string;
  summary: string;
  body: string;
  votes: { for: number; against: number; neutral: number };
  comments: number;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/** OpenRoadmap — quarterly roadmap for the project. */
export interface OpenRoadmap {
  year: number;
  quarters: {
    quarter: string;
    title: string;
    goals: string[];
    status: "in-progress" | "planned" | "exploratory" | "shipped";
  }[];
}

/** Contributor — a top open-source contributor. */
export interface Contributor {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  contributions: number;
  repos: number;
  role: "maintainer" | "contributor" | "alumni";
  badges: string[];
}

// ─── Spotlight ───────────────────────────────────────────────────────────

/** SpotlightItem — one featured content item. */
export interface SpotlightItem {
  id: string;
  title: string;
  type:
    | "case-study"
    | "recipe"
    | "talk"
    | "tutorial"
    | "milestone"
    | "showcase"
    | "article"
    | "plugin";
  author: string;
  url: string;
  thumbnail: string;
  description: string;
  featured: boolean;
  tags: string[];
  publishedAt: string; // ISO timestamp
}

/** WeeklySpotlight — the weekly editorial slot. */
export interface WeeklySpotlight {
  weekOf: string; // ISO date
  title: string;
  summary: string;
  primaryItemId: string;
  relatedItemIds: string[];
  curatedBy: string;
}

// ─── Profiler ────────────────────────────────────────────────────────────

/** ProfilerMetric — one trackable profiler metric. */
export interface ProfilerMetric {
  id: string;
  name: string;
  unit: string;
  category: "render" | "layout" | "memory" | "paint" | "main-thread" | "interaction";
}

/** ProfilerRenderPhase — one render-phase timing. */
export interface ProfilerRenderPhase {
  name: string;
  duration: number; // ms
  componentCount: number;
}

/** ProfilerResult — full profiling trace. */
export interface ProfilerResult {
  id: string;
  url: string;
  status: "queued" | "running" | "complete" | "failed";
  duration: number; // ms
  samples: number;
  startedAt: string; // ISO timestamp
  finishedAt: string; // ISO timestamp
  renderPhases: ProfilerRenderPhase[];
  clsEntries: { element: string; score: number; time: number }[];
  memory: { ts: number; used: number; total: number }[];
  fps: { ts: number; fps: number }[];
  longTasks: number;
  interactionLatency: { p50: number; p75: number; p99: number };
  summary: {
    clsScore: number;
    averageFps: number;
    peakMemoryMb: number;
    jankRatio: number;
  };
}

// ─── Bundle ──────────────────────────────────────────────────────────────

/** BundleResult — output of a bundle analysis. */
export interface BundleResult {
  id: string;
  entry: string;
  status: "queued" | "analyzing" | "complete" | "failed";
  totalSize: number; // bytes
  gzipSize: number; // bytes
  brotliSize: number; // bytes
  analyzedAt: string; // ISO timestamp
  breakdown: { label: string; size: number; share: number }[];
  duplicatesCount: number;
  deadCssCount: number;
  warnings: string[];
}

/** DuplicateModule — a module shipped more than once across the bundle. */
export interface DuplicateModule {
  id: string;
  name: string;
  versions: string[];
  importers: string[];
  totalSize: number; // bytes
  savingPotential: number; // bytes
}

/** DeadCssRule — a CSS rule with no remaining usages. */
export interface DeadCssRule {
  id: string;
  selector: string;
  file: string;
  line: number;
  size: number; // bytes
  lastUsedDaysAgo: number;
}

// ─── Observatory ─────────────────────────────────────────────────────────

/** ObservatorySite — one monitored site. */
export interface ObservatorySite {
  id: string;
  name: string;
  url: string;
  status: "healthy" | "degraded" | "critical" | "offline";
  region: string;
  cwv: {
    lcp: number; // ms
    inp: number; // ms
    cls: number; // score
    ttfb: number; // ms
    fcp: number; // ms
  };
  samples: number;
  lastSeen: string; // ISO timestamp
}

/** ObservatoryAlert — one alert triggered on a site. */
export interface ObservatoryAlert {
  id: string;
  siteId: string;
  severity: "info" | "warning" | "critical";
  metric: string;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: string; // ISO timestamp
  resolved: boolean;
}

/** ObservatoryTrend — CWV trend over a window. */
export interface ObservatoryTrend {
  siteId: string;
  window: "24h" | "7d" | "30d";
  points: { date: string; lcp: number; inp: number; cls: number }[];
}

// ─── OS ──────────────────────────────────────────────────────────────────

/** OSProductTile — one product tile in Roy OS. */
export interface OSProductTile {
  id: string;
  name: string;
  icon: string;
  category: string;
  url: string;
  color: string;
  available: boolean;
}

/** OSActivity — one recent activity item. */
export interface OSActivity {
  id: string;
  type: "deploy" | "publish" | "review" | "comment" | "certify" | "merge" | "invite";
  title: string;
  actor: string;
  ts: string; // ISO timestamp
  meta: Record<string, unknown>;
}

/** OSQuickAction — one quick-action shortcut. */
export interface OSQuickAction {
  id: string;
  label: string;
  icon: string;
  shortcut: string;
  url: string;
}

/** OSDashboard — composed dashboard surface. */
export interface OSDashboard {
  products: OSProductTile[];
  activity: OSActivity[];
  quickActions: OSQuickAction[];
  layout: { section: string; productIds: string[] }[];
}

// ─── Digital Twin ────────────────────────────────────────────────────────

/** TwinResult — output of a digital twin simulation. */
export interface TwinResult {
  id: string;
  url: string;
  status: "queued" | "running" | "complete" | "failed";
  createdAt: string; // ISO timestamp
  duration: number; // ms
  cards: TwinCard[];
}

/** TwinCard — one preview card in a twin simulation. */
export interface TwinCard {
  type: "performance" | "accessibility" | "journey" | "devices";
  title: string;
  score: number; // 0..100
  metrics: Record<string, number | string>;
  notes: string;
}

/** TwinSimulationSummary — list-row view of a twin simulation. */
export interface TwinSimulationSummary {
  id: string;
  url: string;
  status: TwinResult["status"];
  createdAt: string; // ISO timestamp
  averageScore: number; // 0..100
}

// ─── Live ────────────────────────────────────────────────────────────────

/** LiveUser — one participant in a live session. */
export interface LiveUser {
  id: string;
  name: string;
  handle: string;
  color: string;
  role: "host" | "editor" | "viewer";
  joinedAt: string; // ISO timestamp
}

/** LiveMessage — one chat message in a live session. */
export interface LiveMessage {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  ts: string; // ISO timestamp
}

/** LiveSession — a real-time collaborative session. */
export interface LiveSession {
  id: string;
  title: string;
  hostId: string;
  active: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  cursors: {
    userId: string;
    x: number;
    y: number;
    selection: string | null;
  }[];
}

// ─── Benchmark ───────────────────────────────────────────────────────────

/** BenchmarkComparison — RoyCSS vs industry average for one metric. */
export interface BenchmarkComparison {
  id: string;
  metric: string;
  unit: string;
  roycss: number;
  industry: number;
  delta: number; // % change (negative = better when better="lower")
  better: "lower" | "higher";
  description: string;
}

/** BenchmarkResult — output of a benchmark run. */
export interface BenchmarkResult {
  id: string;
  suite: string;
  url: string;
  status: "queued" | "running" | "complete" | "failed";
  runs: number;
  duration: number; // ms
  createdAt: string; // ISO timestamp
  metrics: {
    name: string;
    value: number;
    unit: string;
    p50: number;
    p75: number;
    p99: number;
  }[];
  summary: string;
}

// ─── Blocks ──────────────────────────────────────────────────────────────

/** Block — an application-level Roy Block. */
export interface Block {
  id: string;
  name: string;
  category: string;
  industry: string;
  description: string;
  components: string[];
  tags: string[];
  author: string;
  version: string;
  downloads: number;
  rating: number; // 0..5
  updatedAt: string; // ISO timestamp
}

/** BlockCategory — one block category with a count. */
export interface BlockCategory {
  id: string;
  name: string;
  count: number;
  icon: string;
}

// ─── Blueprints ──────────────────────────────────────────────────────────

/** Blueprint — an industry solution blueprint. */
export interface Blueprint {
  id: string;
  name: string;
  industry: string;
  description: string;
  stack: string[];
  components: string[];
  integrations: string[];
  estimatedCost: string;
  duration: string;
  updatedAt: string; // ISO timestamp
}

/** BlueprintArchitecture — full architecture doc for a blueprint. */
export interface BlueprintArchitecture {
  blueprintId: string;
  layers: {
    name: string;
    technologies: string[];
    responsibility: string;
  }[];
  dataFlow: { from: string; to: string; protocol: string }[];
  decisions: string[];
}

/** BlueprintIndustry — one industry in the blueprint index. */
export interface BlueprintIndustry {
  id: string;
  name: string;
  count: number;
  icon: string;
}

// ─── Plugin Hub ──────────────────────────────────────────────────────────

/** Plugin — one Roy Plugin Hub entry. */
export interface Plugin {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number; // 0..5
  verified: boolean;
  tags: string[];
  license: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/** PluginCategory — one plugin category with a count. */
export interface PluginCategory {
  id: string;
  name: string;
  count: number;
  icon: string;
}

/** PluginChangelogEntry — one published version of a plugin. */
export interface PluginChangelogEntry {
  pluginId: string;
  version: string;
  publishedAt: string; // ISO timestamp
  type: "major" | "minor" | "patch";
  notes: string[];
}

// ─── Search ──────────────────────────────────────────────────────────────

/** SearchableItem — one item in the unified search index. */
export interface SearchableItem {
  id: string;
  type:
    | "components"
    | "effects"
    | "recipes"
    | "templates"
    | "plugins"
    | "documentation"
    | "community"
    | "blueprints";
  title: string;
  description: string;
  url: string;
  tags: string[];
}

/** SearchResult — one matched search result with a relevance score. */
export interface SearchResult {
  id: string;
  type: SearchableItem["type"];
  title: string;
  description: string;
  url: string;
  tags: string[];
  score: number; // 0..100
}

/** RecentSearch — one recent search query. */
export interface RecentSearch {
  id: string;
  query: string;
  results: number;
  ts: string; // ISO timestamp
}
