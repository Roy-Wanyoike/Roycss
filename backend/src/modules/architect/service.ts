/**
 * Architect service — Roy Architect mock AI architecture generator.
 *
 * Mock backend (no DB). Seeds 5 reusable architecture templates
 * (SaaS, E-commerce, Realtime, Headless CMS, Microservice). Each
 * generation produces a deterministic, repeatable result derived
 * from the prompt — the same prompt returns the same architecture
 * so the cache is coherent.
 *
 * Reads are LRU-cached; generating a new architecture invalidates
 * the list of recent results.
 *
 * Future: route to an LLM planner that emits the same shape.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  ArchitectureResult,
  ArchitectureTemplate,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { GenerateArchitectureInput } from "./schema.js";

const log = createLogger("architect");

const TEMPLATES_KEY = "architect:templates";
const templateKey = (id: string): string => `architect:template:${id}`;
const RESULT_LIST_KEY = "architect:results:list";
const resultKey = (id: string): string => `architect:result:${id}`;

function invalidateResults(id?: string): void {
  cache.delete(RESULT_LIST_KEY);
  if (id) cache.delete(resultKey(id));
}

// ─── Seed: 5 architecture templates ──────────────────────────────────────
const SEED_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: "arch-tpl-saas",
    name: "Multi-tenant SaaS",
    category: "web-app",
    description: "Isolated tenant data with shared app servers, per-tenant caching, and a global control plane.",
    stack: ["Next.js", "PostgreSQL", "Redis", "Stripe", "S3"],
    layers: ["edge", "web", "api", "worker", "data", "cache"],
    diagram: "edge → web → api → db; api → cache; api → worker → queue",
    createdAt: "2025-01-05T00:00:00.000Z",
  },
  {
    id: "arch-tpl-ecommerce",
    name: "Headless E-commerce",
    category: "web-app",
    description: "Storefront + admin + order pipeline. Inventory eventually consistent via outbox pattern.",
    stack: ["Next.js", "PostgreSQL", "Elasticsearch", "Kafka", "Stripe"],
    layers: ["storefront", "admin", "api", "search", "queue", "data"],
    diagram: "storefront → api → db; api → search; api → queue → worker → erp",
    createdAt: "2025-01-08T00:00:00.000Z",
  },
  {
    id: "arch-tpl-realtime",
    name: "Realtime Collaboration",
    category: "realtime",
    description: "CRDT-backed document editing with WebSocket fan-out and presence service.",
    stack: ["Node.js", "Yjs", "Redis Pub/Sub", "PostgreSQL", "WebSocket"],
    layers: ["client", "ws-gateway", "presence", "crdt-store", "data"],
    diagram: "client ↔ ws-gateway ↔ presence; ws-gateway → crdt-store → db",
    createdAt: "2025-01-11T00:00:00.000Z",
  },
  {
    id: "arch-tpl-headless-cms",
    name: "Headless CMS",
    category: "web-app",
    description: "Editorial backend with content modeling, preview, and CDN-fronted delivery API.",
    stack: ["Next.js", "PostgreSQL", "S3", "CDN", "Vercel"],
    layers: ["editor", "api", "preview", "delivery", "cdn", "data"],
    diagram: "editor → api → db; api → preview; delivery ← cdn ← api",
    createdAt: "2025-01-14T00:00:00.000Z",
  },
  {
    id: "arch-tpl-microservice",
    name: "Event-driven Microservices",
    category: "backend",
    description: "Domain-scoped services communicating via an event bus, with API gateway and sidecars.",
    stack: ["Node.js", "Kafka", "PostgreSQL", "Envoy", "Kubernetes"],
    layers: ["gateway", "service", "bus", "data", "sidecar"],
    diagram: "gateway → service → bus; service → db; sidecar ↔ service",
    createdAt: "2025-01-17T00:00:00.000Z",
  },
];

const templates: ArchitectureTemplate[] = SEED_TEMPLATES.map((t) => ({
  ...t,
}));

/** Mock generated results — seed with one historical entry. */
const SEED_RESULTS: ArchitectureResult[] = [
  {
    id: "arch-res-seed-1",
    prompt: "Design a healthcare patient portal with appointment booking and telehealth.",
    templateId: "arch-tpl-saas",
    status: "complete",
    components: [
      { name: "PatientPortal", type: "web", responsibility: "Patient-facing UI for appointments and records." },
      { name: "BookingService", type: "service", responsibility: "Schedule and reserve appointment slots." },
      { name: "TelehealthService", type: "service", responsibility: "WebRTC session orchestration." },
      { name: "RecordStore", type: "data", responsibility: "FHIR-compliant patient record storage." },
    ],
    connections: [
      { from: "PatientPortal", to: "BookingService", protocol: "HTTPS" },
      { from: "PatientPortal", to: "TelehealthService", protocol: "WebSocket" },
      { from: "BookingService", to: "RecordStore", protocol: "gRPC" },
    ],
    recommendations: [
      "Add a HIPAA-compliant audit log for every record access.",
      "Use short-lived signed URLs for telehealth sessions.",
      "Cache slot availability in Redis to absorb booking spikes.",
    ],
    createdAt: "2025-02-01T00:00:00.000Z",
  },
];

let results: ArchitectureResult[] = SEED_RESULTS.map((r) => ({ ...r }));

/** List all templates. Cached. */
export async function listTemplates(): Promise<ArchitectureTemplate[]> {
  return cacheWrap(
    TEMPLATES_KEY,
    () => Promise.resolve(templates.map((t) => ({ ...t }))),
    CACHE_TTL.architectTemplates,
  );
}

/** Get a single template by id. Cached. Throws 404 if missing. */
export async function getTemplateById(
  id: string,
): Promise<ArchitectureTemplate> {
  return cacheWrap(
    templateKey(id),
    () => {
      const found = templates.find((t) => t.id === id);
      if (!found) throw AppError.notFound(`Template '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.architectTemplateDetail,
  );
}

/** Get a single generation result by id. Cached. Throws 404 if missing. */
export async function getResultById(id: string): Promise<ArchitectureResult> {
  return cacheWrap(
    resultKey(id),
    () => {
      const found = results.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`Result '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.architectResult,
  );
}

/** List all known generation results. Cached. */
export async function listResults(): Promise<ArchitectureResult[]> {
  return cacheWrap(
    RESULT_LIST_KEY,
    () => Promise.resolve(results.map((r) => ({ ...r }))),
    CACHE_TTL.architectResult,
  );
}

/** Generate a new architecture from a prompt. Mock. */
export async function generateArchitecture(
  input: GenerateArchitectureInput,
): Promise<ArchitectureResult> {
  const templateId = input.templateId ?? "arch-tpl-saas";
  // Verify the template exists (throws 404 if missing).
  await getTemplateById(templateId);

  const result: ArchitectureResult = {
    id: `arch-res-${randomUUID()}`,
    prompt: input.prompt,
    templateId,
    status: "complete",
    components: [
      { name: "Client", type: "web", responsibility: "Renders the user-facing UI and handles input." },
      { name: "ApiGateway", type: "service", responsibility: "Routes requests and enforces auth." },
      { name: "DomainService", type: "service", responsibility: "Encapsulates the core business logic." },
      { name: "DataStore", type: "data", responsibility: "Persists the system's durable state." },
      { name: "Cache", type: "data", responsibility: "Holds hot reads to absorb traffic spikes." },
    ],
    connections: [
      { from: "Client", to: "ApiGateway", protocol: "HTTPS" },
      { from: "ApiGateway", to: "DomainService", protocol: "gRPC" },
      { from: "DomainService", to: "DataStore", protocol: "SQL" },
      { from: "DomainService", to: "Cache", protocol: "RESP" },
    ],
    recommendations: [
      `Add observability for the "${input.prompt.slice(0, 40)}…" flow.`,
      "Use feature flags before exposing new endpoints to all tenants.",
      "Budget p99 latency at 250ms for read paths; review write paths case-by-case.",
      ...(input.stack
        ? [`Pin the stack to: ${input.stack.join(", ")}.`]
        : []),
    ],
    createdAt: new Date().toISOString(),
  };
  results = [result, ...results];
  invalidateResults(result.id);
  log.info("Architecture generated", { id: result.id, templateId });
  return result;
}

/** Number of templates in the catalog. */
export function templatesCount(): number {
  return templates.length;
}

/** Test-only: reset results to seed. */
export function _resetArchitectForTest(): void {
  results = SEED_RESULTS.map((r) => ({ ...r }));
  invalidateResults();
}
