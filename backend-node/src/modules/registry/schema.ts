/**
 * Zod schemas for the registry module.
 *
 * Defines the body shape for POST /registry/packages and route params
 * for /registry/packages/:id.
 */
import { z } from "zod";

/** Body for POST /registry/packages — publish a new package to the registry. */
export const PublishPackageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name is required")
    .max(214, "name must be at most 214 characters")
    .regex(
      /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
      "name must be a valid npm package name",
    ),
  description: z
    .string()
    .trim()
    .min(10, "description must be at least 10 characters")
    .max(2000, "description must be at most 2000 characters"),
  author: z
    .string()
    .trim()
    .min(1, "author is required")
    .max(120, "author must be at most 120 characters"),
  version: z
    .string()
    .trim()
    .min(1, "version is required")
    .regex(
      /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,
      "version must be a valid semver",
    ),
  license: z
    .string()
    .trim()
    .min(1, "license is required")
    .max(80, "license must be at most 80 characters")
    .default("MIT"),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
});
export type PublishPackageInput = z.infer<typeof PublishPackageSchema>;

/** Route params for /registry/packages/:id. */
export const RegistryParamsSchema = z.object({
  id: z.string().min(1),
});
