/**
 * MCP service — in-memory hub for the RoyCSS MCP server catalog.
 *
 * Stores 15 mock MCP tools (mirroring the actual @roycss/mcp-server
 * tool surface), 5 resources, and 3 prompts. All reads are LRU-cached.
 *
 * `executeTool` returns a mock result for the requested tool — it does NOT
 * actually invoke the MCP server. This is intentional: the hub is a
 * metadata + proxy layer; production wiring can delegate to a spawned
 * MCP server process or to direct in-process function calls.
 *
 * Future: replace `executeTool` with a real MCP client that calls the
 * @roycss/mcp-server over stdio or HTTP transport.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { MCPPrompt, MCPResource, MCPTool } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ExecuteToolInput } from "./schema.js";

const log = createLogger("mcp");

const TOOLS_KEY = "mcp:tools";
const detailKey = (name: string): string => `mcp:tool:${name}`;
const RESOURCES_KEY = "mcp:resources";
const PROMPTS_KEY = "mcp:prompts";

// ─── Seed: 15 MCP tools (matching the actual @roycss/mcp-server) ────────
function tool(
  name: string,
  description: string,
  category: string,
  inputSchema: Record<string, unknown>,
): MCPTool {
  return { name, description, inputSchema, category };
}

const SEED_TOOLS: MCPTool[] = [
  tool("search_effects", "Search effects by keyword, category, or tags.", "effects",
    { type: "object", properties: { query: { type: "string" }, category: { type: "string" }, limit: { type: "number" } }, required: ["query"] }),
  tool("get_effect", "Get full metadata for a specific effect by ID.", "effects",
    { type: "object", properties: { id: { type: "string" } }, required: ["id"] }),
  tool("list_categories", "List all effect categories with counts.", "effects",
    { type: "object", properties: {} }),
  tool("get_install", "Get installation instructions for any package manager.", "platform",
    { type: "object", properties: { manager: { type: "string" } }, required: ["manager"] }),
  tool("get_framework_usage", "Get framework-specific code examples.", "platform",
    { type: "object", properties: { framework: { type: "string" } }, required: ["framework"] }),
  tool("get_design_tokens", "Get OKLCH design tokens and color system info.", "design",
    { type: "object", properties: {} }),
  tool("get_recipes", "Get curated effect combinations for common UI patterns.", "recipes",
    { type: "object", properties: { category: { type: "string" } } }),
  tool("get_patterns", "List all 10 UI patterns (Empty State, Loading, etc.).", "patterns",
    { type: "object", properties: {} }),
  tool("get_pattern", "Get a single pattern with full HTML and effectIds.", "patterns",
    { type: "object", properties: { id: { type: "string" } }, required: ["id"] }),
  tool("validate_class_name", "Validate a roycss-* class exists; suggest closest matches.", "inspector",
    { type: "object", properties: { className: { type: "string" } }, required: ["className"] }),
  tool("suggest_for_intent", "From a UX intent string → effects + patterns + recipes.", "assistant",
    { type: "object", properties: { intent: { type: "string" } }, required: ["intent"] }),
  tool("get_accessibility_considerations", "Accessibility guidance (reduced-motion, contrast, focus, ARIA).", "a11y",
    { type: "object", properties: { effectId: { type: "string" } } }),
  tool("get_browser_support", "Per-effect browser support matrix.", "platform",
    { type: "object", properties: { effectId: { type: "string" } }, required: ["effectId"] }),
  tool("get_theme", "Get a saved RoyCSS theme by id.", "design",
    { type: "object", properties: { id: { type: "string" } }, required: ["id"] }),
  tool("get_motion_effect", "Get a Roy Motion library effect by id.", "motion",
    { type: "object", properties: { id: { type: "string" } }, required: ["id"] }),
];

// ─── Seed: 5 resources ───────────────────────────────────────────────────
const SEED_RESOURCES: MCPResource[] = [
  { uri: "roycss://effects", name: "All Effects", description: "All 1,569 effects (compact: id, name, category).", mimeType: "application/json" },
  { uri: "roycss://effects/{id}", name: "Effect Detail", description: "Single effect detail (template).", mimeType: "application/json" },
  { uri: "roycss://categories", name: "Categories", description: "20 categories with counts.", mimeType: "application/json" },
  { uri: "roycss://patterns", name: "Patterns", description: "10 UI patterns (compact).", mimeType: "application/json" },
  { uri: "roycss://recipes", name: "Recipes", description: "12 curated recipes (compact).", mimeType: "application/json" },
];

// ─── Seed: 3 prompts ─────────────────────────────────────────────────────
const SEED_PROMPTS: MCPPrompt[] = [
  {
    name: "design-a-landing-page",
    description: "Brief for building a landing page with RoyCSS.",
    arguments: [
      { name: "product", description: "Product name.", required: true },
      { name: "audience", description: "Target audience.", required: false },
    ],
  },
  {
    name: "build-a-loading-state",
    description: "Brief for building a loading state (varies by wait duration).",
    arguments: [
      { name: "duration", description: "Expected wait (seconds).", required: true },
    ],
  },
  {
    name: "accessibility-audit",
    description: "Brief for auditing a page/component for a11y issues.",
    arguments: [
      { name: "url", description: "Page URL or selector.", required: true },
    ],
  },
];

/** List all MCP tools. Cached. */
export async function listTools(): Promise<MCPTool[]> {
  return cacheWrap(
    TOOLS_KEY,
    () => Promise.resolve(SEED_TOOLS.map((t) => ({ ...t }))),
    CACHE_TTL.mcpTools,
  );
}

/** Get a single MCP tool by name. Cached. Throws 404 if missing. */
export async function getToolByName(name: string): Promise<MCPTool> {
  return cacheWrap(
    detailKey(name),
    () => {
      const found = SEED_TOOLS.find((t) => t.name === name);
      if (!found) throw AppError.notFound(`MCP tool '${name}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.mcpToolDetail,
  );
}

/** List all MCP resources. Cached. */
export async function listResources(): Promise<MCPResource[]> {
  return cacheWrap(
    RESOURCES_KEY,
    () => Promise.resolve(SEED_RESOURCES.map((r) => ({ ...r }))),
    CACHE_TTL.mcpResources,
  );
}

/** List all MCP prompts. Cached. */
export async function listPrompts(): Promise<MCPPrompt[]> {
  return cacheWrap(
    PROMPTS_KEY,
    () => Promise.resolve(SEED_PROMPTS.map((p) => ({ ...p }))),
    CACHE_TTL.mcpPrompts,
  );
}

/**
 * Execute an MCP tool. Mock — returns a synthetic success payload.
 *
 * Validates that the requested tool exists (throws 404 otherwise), then
 * returns a deterministic mock result. Production wiring would forward
 * this call to the actual MCP server over stdio/HTTP.
 */
export async function executeTool(
  input: ExecuteToolInput,
): Promise<{
  tool: string;
  ok: true;
  result: unknown;
  durationMs: number;
}> {
  // Validate existence (throws 404 if missing).
  await getToolByName(input.name);

  const start = Date.now();
  const result = mockResultFor(input.name, input.arguments);
  const durationMs = Date.now() - start;

  log.info("MCP tool executed", { tool: input.name, durationMs });

  return {
    tool: input.name,
    ok: true as const,
    result,
    durationMs,
  };
}

/** Produce a deterministic mock result for a given tool. */
function mockResultFor(
  name: string,
  args: Record<string, unknown>,
): unknown {
  switch (name) {
    case "search_effects":
      return {
        query: (args.query as string) ?? "",
        count: 3,
        results: [
          { id: "text-gradient", name: "Text Gradient", category: "text" },
          { id: "card-glassmorphism", name: "Glassmorphism Card", category: "cards" },
          { id: "fade-in-up", name: "Fade In Up", category: "animations" },
        ],
      };
    case "get_effect":
      return {
        id: (args.id as string) ?? "text-gradient",
        name: "Text Gradient",
        category: "text",
        cssCode: ".roycss-text-gradient{background:linear-gradient(90deg,#10b981,#6366f1);-webkit-background-clip:text;background-clip:text;color:transparent}",
      };
    case "list_categories":
      return [
        { category: "text", count: 184 },
        { category: "cards", count: 142 },
        { category: "animations", count: 220 },
      ];
    case "validate_class_name": {
      const cls = (args.className as string) ?? "";
      const exists = cls.startsWith("roycss-");
      return {
        className: cls,
        valid: exists,
        suggestions: exists ? [] : ["roycss-card", "roycss-btn-primary"],
      };
    }
    case "suggest_for_intent":
      return {
        intent: (args.intent as string) ?? "",
        effects: ["fade-in-up", "card-glassmorphism"],
        patterns: ["empty-state", "loading-skeleton"],
        recipes: ["hero-section"],
      };
    default:
      return { ok: true, message: `Tool '${name}' executed (mock).`, args };
  }
}

/** Number of tools in the catalog. */
export function toolsCount(): number {
  return SEED_TOOLS.length;
}

log.debug("MCP module loaded", { tools: SEED_TOOLS.length });
