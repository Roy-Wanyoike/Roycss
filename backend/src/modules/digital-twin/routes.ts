/**
 * Digital Twin routes — /api/v1/digital-twin
 *
 *   POST  /create              create a digital twin simulation
 *   GET   /results/:id         fetch a simulation result by id
 *   GET   /simulations         list all known simulations
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  createTwinSimulation,
  getTwinResultById,
  listSimulations,
} from "./service.js";
import { CreateTwinSchema, IdParamsSchema } from "./schema.js";

export const digitalTwinRouter = Router();

digitalTwinRouter.get(
  "/simulations",
  asyncHandler(async (_req, res) => {
    const items = await listSimulations();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

digitalTwinRouter.post(
  "/create",
  validateBody(CreateTwinSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof CreateTwinSchema>;
    const result = await createTwinSimulation(input);
    res.status(202).json({ data: result });
  }),
);

digitalTwinRouter.get(
  "/results/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const result = await getTwinResultById(id);
    res.json({ data: result });
  }),
);
