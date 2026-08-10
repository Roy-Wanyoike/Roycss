/**
 * Zod schemas for the mcp module.
 *
 * Defines the execute-tool payload shape and the route params for
 * /tools/:name. The `MCPTool`/`MCPResource`/`MCPPrompt` domain types live
 * in `../../types/index.ts`.
 *
 * Tool input arguments are intentionally free-form (Record<string, unknown>)
 * because each MCP tool has its own input schema — validation of those
 * arguments happens server-side in the actual MCP server.
 */
import { z } from "zod";

/** Route params for /mcp/tools/:name. */
export const MCPToolParamsSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z_][a-z0-9_]*$/, "Tool name must be snake_case"),
});

/** Body for POST /mcp/execute — execute an MCP tool. */
export const ExecuteToolSchema = z.object({
  name: z
    .string()
    .min(1, "Tool name is required")
    .max(80, "Tool name must be at most 80 characters")
    .regex(/^[a-z_][a-z0-9_]*$/, "Tool name must be snake_case"),
  arguments: z.record(z.string(), z.unknown()).default({}),
});
export type ExecuteToolInput = z.infer<typeof ExecuteToolSchema>;
