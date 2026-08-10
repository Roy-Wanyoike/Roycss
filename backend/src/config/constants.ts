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
  // ── 8 new modules (Roy Cloud, DevTools, Motion, Enterprise,
  //    Inspector, Studio, Pro Components, MCP Hub) ────────────────────────
  cloudStatus: 1 * 60 * 1000, // 1 min — status changes often
  cloudProjects: 5 * 60 * 1000, // 5 min
  cloudProjectDetail: 5 * 60 * 1000,
  cloudStorage: 5 * 60 * 1000,
  cloudDeployments: 5 * 60 * 1000,
  devtoolsInspect: 5 * 60 * 1000,
  devtoolsTokens: 10 * 60 * 1000,
  devtoolsUtilities: 10 * 60 * 1000,
  motionEffects: 10 * 60 * 1000,
  motionEffectDetail: 10 * 60 * 1000,
  motionPresets: 10 * 60 * 1000,
  motionCategories: 10 * 60 * 1000,
  enterpriseOrganizations: 5 * 60 * 1000,
  enterpriseTeams: 5 * 60 * 1000,
  enterpriseLicenses: 5 * 60 * 1000,
  enterpriseAuditLog: 5 * 60 * 1000,
  inspectorClasses: 10 * 60 * 1000,
  inspectorClassDetail: 10 * 60 * 1000,
  inspectorEffects: 10 * 60 * 1000,
  inspectorScan: 5 * 60 * 1000,
  studioProjects: 5 * 60 * 1000,
  studioProjectDetail: 5 * 60 * 1000,
  studioTemplates: 10 * 60 * 1000,
  proComponents: 10 * 60 * 1000,
  proComponentDetail: 10 * 60 * 1000,
  proComponentCode: 10 * 60 * 1000,
  proCategories: 10 * 60 * 1000,
  mcpTools: 10 * 60 * 1000,
  mcpToolDetail: 10 * 60 * 1000,
  mcpResources: 10 * 60 * 1000,
  mcpPrompts: 10 * 60 * 1000,
  // ── 12 batch-2 modules (platform completion) ───────────────────────────
  complianceStandards: 10 * 60 * 1000,
  complianceResults: 5 * 60 * 1000,
  complianceResultDetail: 5 * 60 * 1000,
  complianceReports: 10 * 60 * 1000,
  auditProjects: 5 * 60 * 1000,
  auditProjectDetail: 5 * 60 * 1000,
  auditIssues: 5 * 60 * 1000,
  auditTrends: 10 * 60 * 1000,
  fleetProjects: 5 * 60 * 1000,
  fleetProjectDetail: 5 * 60 * 1000,
  fleetHealth: 1 * 60 * 1000,
  workspaceResources: 10 * 60 * 1000,
  workspaceResourceType: 10 * 60 * 1000,
  workspaceTeam: 5 * 60 * 1000,
  deployPlatforms: 10 * 60 * 1000,
  deployEnvironments: 10 * 60 * 1000,
  deployHistory: 5 * 60 * 1000,
  deployHistoryDetail: 5 * 60 * 1000,
  previewList: 5 * 60 * 1000,
  previewDetail: 5 * 60 * 1000,
  cdnStats: 1 * 60 * 1000,
  cdnResources: 10 * 60 * 1000,
  cdnEdges: 10 * 60 * 1000,
  storageFiles: 5 * 60 * 1000,
  storageFileDetail: 5 * 60 * 1000,
  storageUsage: 5 * 60 * 1000,
  edgeRegions: 10 * 60 * 1000,
  edgeConfig: 10 * 60 * 1000,
  edgePerformance: 5 * 60 * 1000,
  mentorTopics: 10 * 60 * 1000,
  mentorLevels: 10 * 60 * 1000,
  mentorProgress: 5 * 60 * 1000,
  challengesList: 10 * 60 * 1000,
  challengeDetail: 10 * 60 * 1000,
  challengeLeaderboard: 5 * 60 * 1000,
  certificationsList: 10 * 60 * 1000,
  certificationDetail: 10 * 60 * 1000,
  certificationVerify: 10 * 60 * 1000,
  // ── 12 batch-1 modules (platform modules) ─────────────────────────────
  a11yRules: 10 * 60 * 1000,
  a11yAudit: 5 * 60 * 1000,
  a11yContrast: 10 * 60 * 1000,
  architectTemplates: 10 * 60 * 1000,
  architectTemplateDetail: 10 * 60 * 1000,
  architectResult: 5 * 60 * 1000,
  reviewRules: 10 * 60 * 1000,
  reviewHistory: 5 * 60 * 1000,
  reviewResult: 5 * 60 * 1000,
  refactorFrameworks: 10 * 60 * 1000,
  refactorResult: 5 * 60 * 1000,
  pairHistory: 5 * 60 * 1000,
  pairSuggestions: 10 * 60 * 1000,
  designerPresets: 10 * 60 * 1000,
  designerResult: 5 * 60 * 1000,
  scaffoldTypes: 10 * 60 * 1000,
  scaffoldTypeDetail: 10 * 60 * 1000,
  scaffoldFrameworks: 10 * 60 * 1000,
  generatorTypes: 10 * 60 * 1000,
  generatorTemplates: 10 * 60 * 1000,
  syncStatus: 1 * 60 * 1000,
  syncHistory: 5 * 60 * 1000,
  versionCurrent: 1 * 60 * 1000,
  versionLatest: 1 * 60 * 1000,
  versionChangelog: 10 * 60 * 1000,
  versionBreakingChanges: 10 * 60 * 1000,
  registryPackages: 10 * 60 * 1000,
  registryPackageDetail: 10 * 60 * 1000,
  registryPackageVersions: 10 * 60 * 1000,
  governanceApprovals: 5 * 60 * 1000,
  governancePolicies: 10 * 60 * 1000,
  governanceAuditLog: 5 * 60 * 1000,
  // ── 13 batch-3 modules (final platform surface) ───────────────────────
  openIssues: 10 * 60 * 1000,
  openIssueDetail: 10 * 60 * 1000,
  openRfcs: 5 * 60 * 1000,
  openRfcDetail: 5 * 60 * 1000,
  openRoadmap: 30 * 60 * 1000,
  openContributors: 30 * 60 * 1000,
  spotlightItems: 5 * 60 * 1000,
  spotlightFeatured: 5 * 60 * 1000,
  spotlightItemDetail: 10 * 60 * 1000,
  spotlightWeekly: 30 * 60 * 1000,
  profilerMetrics: 30 * 60 * 1000,
  profilerResults: 5 * 60 * 1000,
  profilerResultDetail: 5 * 60 * 1000,
  bundleDuplicates: 10 * 60 * 1000,
  bundleDeadCss: 10 * 60 * 1000,
  bundleResultDetail: 5 * 60 * 1000,
  observatorySites: 1 * 60 * 1000,
  observatorySiteDetail: 1 * 60 * 1000,
  observatoryAlerts: 1 * 60 * 1000,
  observatoryTrend: 5 * 60 * 1000,
  osDashboard: 5 * 60 * 1000,
  osProducts: 30 * 60 * 1000,
  osActivity: 1 * 60 * 1000,
  osQuickActions: 30 * 60 * 1000,
  twinSimulations: 5 * 60 * 1000,
  twinResultDetail: 5 * 60 * 1000,
  liveSessionDetail: 10 * 1000,
  liveSessionUsers: 10 * 1000,
  liveSessionMessages: 10 * 1000,
  benchmarkComparisons: 30 * 60 * 1000,
  benchmarkResultDetail: 5 * 60 * 1000,
  blocksList: 10 * 60 * 1000,
  blockDetail: 10 * 60 * 1000,
  blockCategories: 30 * 60 * 1000,
  blueprintsList: 30 * 60 * 1000,
  blueprintDetail: 30 * 60 * 1000,
  blueprintIndustries: 30 * 60 * 1000,
  blueprintArchitecture: 30 * 60 * 1000,
  pluginsList: 10 * 60 * 1000,
  pluginDetail: 10 * 60 * 1000,
  pluginCategories: 30 * 60 * 1000,
  pluginChangelog: 10 * 60 * 1000,
  searchQuery: 1 * 60 * 1000,
  searchSuggestions: 5 * 60 * 1000,
  searchRecent: 1 * 60 * 1000,
  // ── 8 modern-CSS developer-tool modules (Task 1-f) ─────────────────────
  colorSpacePresets: 30 * 60 * 1000,
  colorSpaceConvert: 5 * 60 * 1000,
  colorSpaceGamut: 5 * 60 * 1000,
  styleQueryPresets: 30 * 60 * 1000,
  styleQueryGenerate: 5 * 60 * 1000,
  scopePresets: 30 * 60 * 1000,
  scopeAnalyze: 5 * 60 * 1000,
  subgridPresets: 30 * 60 * 1000,
  subgridGenerate: 5 * 60 * 1000,
  fallbackProperties: 30 * 60 * 1000,
  fallbackPropertyDetail: 30 * 60 * 1000,
  fallbackPresets: 30 * 60 * 1000,
  logicalMapping: 30 * 60 * 1000,
  logicalConvert: 5 * 60 * 1000,
  logicalPresets: 30 * 60 * 1000,
  initialLetterPresets: 30 * 60 * 1000,
  initialLetterGenerate: 5 * 60 * 1000,
  textWrapPresets: 30 * 60 * 1000,
  textWrapAnalyze: 5 * 60 * 1000,
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
