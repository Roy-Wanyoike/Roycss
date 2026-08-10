/**
 * Blueprints service — Roy Blueprints (industry solution blueprints).
 *
 * Mock backend (no DB). Seeds 8 blueprints (Hospital, POS, ERP, HR,
 * Banking, Education, AI Dashboard, Logistics) plus an architecture
 * doc per blueprint and an industry index.
 *
 * Reads are LRU-cached. No mutation endpoints — blueprints are a
 * curated catalog.
 *
 * Future: persist via Prisma `Blueprint` model and author content in
 * a CMS.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  Blueprint,
  BlueprintArchitecture,
  BlueprintIndustry,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("blueprints");

const BLUEPRINTS_KEY = "blueprints:list";
const INDUSTRIES_KEY = "blueprints:industries";
const blueprintKey = (id: string): string => `blueprint:${id}`;
const architectureKey = (id: string): string => `blueprint:${id}:architecture`;

function bp(
  id: string,
  name: string,
  industry: string,
  description: string,
  stack: string[],
  components: string[],
  integrations: string[],
  estimatedCost: string,
  duration: string,
): Blueprint {
  return {
    id,
    name,
    industry,
    description,
    stack,
    components,
    integrations,
    estimatedCost,
    duration,
    updatedAt: "2025-02-01T00:00:00.000Z",
  };
}

// ─── Seed: 8 blueprints ─────────────────────────────────────────────────
const SEED_BLUEPRINTS: Blueprint[] = [
  bp("bp-hospital", "Hospital Management", "healthcare", "End-to-end hospital operations: admissions, EHR, scheduling, billing, and pharmacy.", ["Next.js", "RoyCSS", "PostgreSQL", "Redis"], ["PatientCard", "EhrEditor", "ScheduleGrid", "PharmacyList"], ["Epic FHIR API", "Stripe", "Twilio"], "$80k–$140k", "4–6 months"),
  bp("bp-pos", "Point of Sale (POS)", "retail", "In-store point-of-sale system with offline-first sync, payments, and inventory.", ["React Native", "RoyCSS", "SQLite", "Node.js"], ["RegisterScreen", "CartList", "PaymentPad", "ReceiptPrinter"], ["Stripe Terminal", "Square", "QuickBooks"], "$30k–$60k", "2–3 months"),
  bp("bp-erp", "ERP Suite", "enterprise", "Modular ERP: finance, HR, inventory, procurement, and reporting.", ["Next.js", "RoyCSS", "PostgreSQL", "Kafka"], ["FinanceDashboard", "InventoryGrid", "ProcurementFlow", "ReportBuilder"], ["SAP", "Oracle", "Xero"], "$200k+", "9–12 months"),
  bp("bp-hr", "HR Platform", "hr", "Recruiting, onboarding, payroll, performance, and time-off management.", ["Next.js", "RoyCSS", "PostgreSQL"], ["ApplicantTracker", "OnboardingWizard", "PayrollTable", "ReviewForm"], ["Greenhouse", "Gusto", "Slack"], "$60k–$110k", "3–5 months"),
  bp("bp-banking", "Digital Banking", "fintech", "Consumer banking app with accounts, transfers, KYC, and fraud alerts.", ["Next.js", "RoyCSS", "PostgreSQL", "Kafka"], ["AccountCard", "TransferFlow", "KycWizard", "FraudAlert"], ["Plaid", "Stripe", "LexisNexis"], "$150k+", "6–9 months"),
  bp("bp-education", "Education Platform", "education", "LMS with courses, assignments, grading, and parent portal.", ["Next.js", "RoyCSS", "PostgreSQL"], ["CourseList", "AssignmentEditor", "Gradebook", "ParentDashboard"], ["Google Classroom", "Zoom", "Stripe"], "$50k–$90k", "3–4 months"),
  bp("bp-ai-dashboard", "AI Dashboard", "ai", "GenAI dashboard with chat, model routing, usage analytics, and guardrails.", ["Next.js", "RoyCSS", "PostgreSQL", "Redis"], ["ChatPanel", "ModelRouter", "UsageChart", "GuardrailToggle"], ["OpenAI", "Anthropic", "Pinecone"], "$40k–$80k", "2–3 months"),
  bp("bp-logistics", "Logistics Operations", "logistics", "Fleet, warehouse, routing, and shipment tracking with live ETAs.", ["Next.js", "RoyCSS", "PostgreSQL", "Kafka"], ["FleetMap", "WarehouseGrid", "RoutePlanner", "ShipmentTracker"], ["Mapbox", "Samsara", "Stripe"], "$90k–$160k", "5–7 months"),
];

// ─── Seed: industries ───────────────────────────────────────────────────
const SEED_INDUSTRIES: BlueprintIndustry[] = [
  { id: "ind-healthcare", name: "Healthcare", count: 1, icon: "heart-pulse" },
  { id: "ind-retail", name: "Retail", count: 1, icon: "shopping-cart" },
  { id: "ind-enterprise", name: "Enterprise", count: 1, icon: "building" },
  { id: "ind-hr", name: "HR", count: 1, icon: "users" },
  { id: "ind-fintech", name: "Fintech", count: 1, icon: "banknote" },
  { id: "ind-education", name: "Education", count: 1, icon: "graduation-cap" },
  { id: "ind-ai", name: "AI", count: 1, icon: "cpu" },
  { id: "ind-logistics", name: "Logistics", count: 1, icon: "truck" },
];

const blueprints: Blueprint[] = SEED_BLUEPRINTS.map((b) => ({
  ...b,
  stack: [...b.stack],
  components: [...b.components],
  integrations: [...b.integrations],
}));

/** List all blueprints. Cached. */
export async function listBlueprints(): Promise<Blueprint[]> {
  return cacheWrap(
    BLUEPRINTS_KEY,
    () =>
      Promise.resolve(
        blueprints.map((b) => ({
          ...b,
          stack: [...b.stack],
          components: [...b.components],
          integrations: [...b.integrations],
        })),
      ),
    CACHE_TTL.blueprintsList,
  );
}

/** Get a single blueprint by id. Throws 404 if missing. */
export async function getBlueprintById(id: string): Promise<Blueprint> {
  return cacheWrap(
    blueprintKey(id),
    () => {
      const found = blueprints.find((b) => b.id === id);
      if (!found) throw AppError.notFound(`Blueprint '${id}' not found`);
      return Promise.resolve({
        ...found,
        stack: [...found.stack],
        components: [...found.components],
        integrations: [...found.integrations],
      });
    },
    CACHE_TTL.blueprintDetail,
  );
}

/** List all blueprint industries. Cached. */
export async function listBlueprintIndustries(): Promise<BlueprintIndustry[]> {
  return cacheWrap(
    INDUSTRIES_KEY,
    () => Promise.resolve(SEED_INDUSTRIES.map((i) => ({ ...i }))),
    CACHE_TTL.blueprintIndustries,
  );
}

/** Get the full architecture doc for a blueprint. Throws 404 if missing. */
export async function getBlueprintArchitecture(
  id: string,
): Promise<BlueprintArchitecture> {
  return cacheWrap(
    architectureKey(id),
    () => {
      const found = blueprints.find((b) => b.id === id);
      if (!found) throw AppError.notFound(`Blueprint '${id}' not found`);
      const architecture: BlueprintArchitecture = {
        blueprintId: found.id,
        layers: [
          { name: "Presentation", technologies: ["Next.js", "RoyCSS"], responsibility: "UI, accessibility, performance" },
          { name: "Application", technologies: ["Node.js", "tRPC"], responsibility: "Business logic, orchestration" },
          { name: "Domain", technologies: ["TypeScript"], responsibility: "Domain models, validation" },
          { name: "Persistence", technologies: ["PostgreSQL", "Redis"], responsibility: "Storage, caching" },
          { name: "Integration", technologies: found.integrations, responsibility: "Third-party services" },
        ],
        dataFlow: [
          { from: "Client", to: "Edge", protocol: "HTTPS" },
          { from: "Edge", to: "API", protocol: "tRPC" },
          { from: "API", to: "Domain", protocol: "in-process" },
          { from: "Domain", to: "Persistence", protocol: "Prisma" },
        ],
        decisions: [
          "Edge-first: serve cached reads from the nearest edge region.",
          "Event-driven writes: outbox pattern → Kafka → consumers.",
          "Strict typing end-to-end via tRPC + Zod.",
          "RoyCSS Pro Components power the entire UI surface.",
        ],
      };
      return Promise.resolve({
        ...architecture,
        layers: architecture.layers.map((l) => ({
          ...l,
          technologies: [...l.technologies],
        })),
        dataFlow: architecture.dataFlow.map((f) => ({ ...f })),
        decisions: [...architecture.decisions],
      });
    },
    CACHE_TTL.blueprintArchitecture,
  );
}

log.debug("Blueprints module loaded", {
  blueprints: blueprints.length,
  industries: SEED_INDUSTRIES.length,
});
