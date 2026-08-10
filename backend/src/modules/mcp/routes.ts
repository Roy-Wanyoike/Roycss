/**
 * MCP routes — /api/v1/mcp
 *
 *   GET   /tools           list all MCP tools
 *   GET   /tools/:name     single tool details
 *   POST  /execute         execute a tool (mock)
 *   GET   /resources       list resources
 *   GET   /prompts         list prompts
 *
 * Order matters: /tools, /resources, /prompts, /execute are declared
 * before /tools/:name so the literal paths aren't captured as a tool name.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody, validateParams } from "../../server/middleware/validate.js";
import {
  executeTool,
  getToolByName,
  listPrompts,
  listResources,
  listTools,
} from "./service.js";
import { ExecuteToolSchema, MCPToolParamsSchema } from "./schema.js";

export const mcpRouter = Router();

mcpRouter.get(
  "/tools",
  asyncHandler(async (_req, res) => {
    const items = await listTools();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

mcpRouter.get(
  "/resources",
  asyncHandler(async (_req, res) => {
    const items = await listResources();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

mcpRouter.get(
  "/prompts",
  asyncHandler(async (_req, res) => {
    const items = await listPrompts();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

mcpRouter.post(
  "/execute",
  validateBody(ExecuteToolSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof ExecuteToolSchema>;
    const result = await executeTool(input);
    res.json({ data: result });
  }),
);

mcpRouter.get(
  "/tools/:name",
  validateParams(MCPToolParamsSchema),
  asyncHandler(async (req, res) => {
    const { name } = req.params as unknown as z.infer<typeof MCPToolParamsSchema>;
    const tool = await getToolByName(name);
    res.json({ data: tool });
  }),
);
