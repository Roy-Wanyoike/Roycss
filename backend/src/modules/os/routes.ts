/**
 * OS routes — /api/v1/os
 *
 *   GET   /dashboard         the Roy OS dashboard layout
 *   GET   /products          list all product tiles
 *   GET   /activity          recent activity feed
 *   GET   /quick-actions     quick-action shortcuts
 */
import { Router } from "express";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  getDashboard,
  listActivity,
  listProducts,
  listQuickActions,
} from "./service.js";

export const osRouter = Router();

osRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const dashboard = await getDashboard();
    res.json({ data: dashboard });
  }),
);

osRouter.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const items = await listProducts();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

osRouter.get(
  "/activity",
  asyncHandler(async (_req, res) => {
    const items = await listActivity();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

osRouter.get(
  "/quick-actions",
  asyncHandler(async (_req, res) => {
    const items = await listQuickActions();
    res.json({ data: items, meta: { count: items.length } });
  }),
);
