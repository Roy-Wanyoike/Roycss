/**
 * Certifications service — Prisma-backed Roy Certifications catalog +
 * exam-attempt store.
 *
 * Persisted via the `Certification` + `CertificationAttempt` Prisma
 * models. Seeds 4 certification levels on first access. Earned
 * certifications (with their verify codes) remain static in-memory
 * seed data — the `CertificationAttempt` schema has no verifyCode
 * column, so the verify endpoint stays backed by the static seed.
 *
 * Field-mapping: the Prisma `Certification` model exposes (slug, name,
 * description, requirementsJson). The domain shape's `level`, `price`,
 * `duration`, `passingScore`, `topicCount` are JSON-encoded inside
 * `requirementsJson` as a wrapper. `slug ← id`.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  Certification,
  EarnedCertification,
  ExamQuestion,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("certifications");

const LIST_KEY = "certifications:list";
const detailKey = (id: string): string => `certification:${id}`;
const verifyKey = (code: string): string => `certification:verify:${code}`;

function invalidateVerify(code?: string): void {
  if (code) cache.delete(verifyKey(code));
}

// ─── Seed: 4 certification levels ────────────────────────────────────────
const SEED_CERTIFICATIONS: Certification[] = [
  {
    id: "cert-associate",
    name: "RoyCSS Associate",
    level: "Associate",
    description:
      "Foundational CSS knowledge — selectors, the box model, flexbox, and basic accessibility.",
    price: 99,
    duration: 60,
    passingScore: 70,
    topicCount: 6,
  },
  {
    id: "cert-professional",
    name: "RoyCSS Professional",
    level: "Professional",
    description:
      "Production CSS — grid, animations, responsive design, and design systems.",
    price: 199,
    duration: 90,
    passingScore: 75,
    topicCount: 10,
  },
  {
    id: "cert-expert",
    name: "RoyCSS Expert",
    level: "Expert",
    description:
      "Advanced CSS — cascade layers, container queries, view transitions, and performance.",
    price: 299,
    duration: 120,
    passingScore: 80,
    topicCount: 12,
  },
  {
    id: "cert-architect",
    name: "RoyCSS Architect",
    level: "Architect",
    description:
      "Design-system architecture — token pipelines, theming, governance, and team scale.",
    price: 399,
    duration: 150,
    passingScore: 85,
    topicCount: 14,
  },
];

// ─── Seed: exam questions per certification ──────────────────────────────
const SEED_QUESTIONS: Record<string, ExamQuestion[]> = {
  "cert-associate": [
    {
      id: "q-assoc-1",
      question: "Which property sets the space between flex items?",
      options: ["gap", "spacing", "padding", "margin"],
      correctIndex: 0,
      explanation: "`gap` sets the spacing between flex (and grid) items.",
    },
    {
      id: "q-assoc-2",
      question: "Which selector has the highest specificity?",
      options: [".btn", "button", "#submit", "button.btn"],
      correctIndex: 2,
      explanation: "ID selectors (#id) have higher specificity than class or element selectors.",
    },
    {
      id: "q-assoc-3",
      question: "Which display value enables flexbox on a container?",
      options: ["flex", "block", "inline-flex-only", "grid"],
      correctIndex: 0,
      explanation: "`display: flex` enables flexbox on a container element.",
    },
  ],
  "cert-professional": [
    {
      id: "q-pro-1",
      question: "Which CSS feature lets you size a child based on its container, not the viewport?",
      options: ["Media queries", "Container queries", "Viewport units", "Flex-basis"],
      correctIndex: 1,
      explanation: "Container queries allow components to respond to their container's size.",
    },
    {
      id: "q-pro-2",
      question: "Which property controls the curve of an animation's acceleration?",
      options: ["transition", "animation-curve", "animation-timing-function", "ease-curve"],
      correctIndex: 2,
      explanation: "`animation-timing-function` (or `transition-timing-function`) controls easing.",
    },
    {
      id: "q-pro-3",
      question: "What does `grid-template-areas` let you do?",
      options: [
        "Define named grid regions in a visual layout",
        "Set the grid's column widths",
        "Animate grid transitions",
        "Set the row gap",
      ],
      correctIndex: 0,
      explanation: "`grid-template-areas` lets you name grid regions for visual layout.",
    },
  ],
  "cert-expert": [
    {
      id: "q-exp-1",
      question: "Which `@layer` ordering puts `theme` styles below `base` styles?",
      options: [
        "@layer theme, base;",
        "@layer base, theme;",
        "@layer base.theme;",
        "@import layer(theme, base);",
      ],
      correctIndex: 1,
      explanation: "Layers listed earlier have lower priority; `@layer base, theme;` puts theme above base.",
    },
    {
      id: "q-exp-2",
      question: "Which API enables smooth animated transitions between two DOM states?",
      options: ["View Transitions API", "Resize Observer", "Intersection Observer", "CSS Houdini"],
      correctIndex: 0,
      explanation: "The View Transitions API animates between two DOM states with a crossfade.",
    },
    {
      id: "q-exp-3",
      question: "Which CSS function returns the smallest of a list of values?",
      options: ["max()", "min()", "clamp()", "calc()"],
      correctIndex: 1,
      explanation: "`min()` returns the smallest value from its comma-separated list.",
    },
  ],
  "cert-architect": [
    {
      id: "q-arch-1",
      question: "Which token-naming convention scales best across themes?",
      options: [
        "Color names (e.g. --blue-500)",
        "Semantic names (e.g. --color-action-primary)",
        "Hex values (e.g. --3b82f6)",
        "Component names (e.g. --button-blue)",
      ],
      correctIndex: 1,
      explanation: "Semantic tokens (--color-action-primary) decouple intent from implementation and survive rebranding.",
    },
    {
      id: "q-arch-2",
      question: "Which approach is best for distributing a design system across teams?",
      options: [
        "Hard-code values in each app",
        "A versioned token package consumed by all apps",
        "Email the values to each team",
        "A single CSS file copied into each app",
      ],
      correctIndex: 1,
      explanation: "A versioned token package (npm) is the canonical way to distribute design tokens at scale.",
    },
    {
      id: "q-arch-3",
      question: "Which policy best prevents unreviewed token changes from reaching production?",
      options: [
        "Anyone can merge to main",
        "Require code review + CI lint on token files",
        "Lock the repo to one person",
        "Skip CI for token changes",
      ],
      correctIndex: 1,
      explanation: "Code review + CI lint (with breaking-change detection) on token files is the recommended policy.",
    },
  ],
};

// ─── Seed: 2 earned certifications (static — no Prisma model field) ───
const SEED_EARNED: EarnedCertification[] = [
  {
    id: "earned-1",
    certificationId: "cert-professional",
    userId: "user-2",
    userName: "Maya Singh",
    score: 88,
    issuedAt: "2025-02-15T10:30:00.000Z",
    expiresAt: "2028-02-15T10:30:00.000Z",
    verifyCode: "ROY-MAYA-2025-PRO-88",
  },
  {
    id: "earned-2",
    certificationId: "cert-associate",
    userId: "user-3",
    userName: "Leo Park",
    score: 91,
    issuedAt: "2025-02-10T14:15:00.000Z",
    expiresAt: "2028-02-10T14:15:00.000Z",
    verifyCode: "ROY-LEO-2025-ASSOC-91",
  },
];

let earned: EarnedCertification[] = SEED_EARNED.map((e) => ({ ...e }));

interface CertMeta {
  level: Certification["level"];
  price: number;
  duration: number;
  passingScore: number;
  topicCount: number;
}

function toDbRow(c: Certification) {
  const meta: CertMeta = {
    level: c.level,
    price: c.price,
    duration: c.duration,
    passingScore: c.passingScore,
    topicCount: c.topicCount,
  };
  return {
    id: c.id,
    slug: c.id,
    name: c.name,
    description: c.description,
    requirementsJson: JSON.stringify(meta),
  };
}

function toDomain(row: {
  id: string;
  name: string;
  description: string;
  requirementsJson: string;
}): Certification {
  let meta: CertMeta = {
    level: "Associate",
    price: 0,
    duration: 0,
    passingScore: 0,
    topicCount: 0,
  };
  try {
    meta = JSON.parse(row.requirementsJson) as CertMeta;
  } catch {
    // Keep defaults.
  }
  return {
    id: row.id,
    name: row.name,
    level: meta.level,
    description: row.description,
    price: meta.price,
    duration: meta.duration,
    passingScore: meta.passingScore,
    topicCount: meta.topicCount,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.certification.count();
    if (count === 0) {
      await db.certification.createMany({
        data: SEED_CERTIFICATIONS.map(toDbRow),
      });
      log.info("Certifications seeded", { count: SEED_CERTIFICATIONS.length });
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all certifications. Cached. */
export async function listCertifications(): Promise<Certification[]> {
  return cacheWrap(
    LIST_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.certification.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(toDomain);
    },
    CACHE_TTL.certificationsList,
  );
}

/** Get a single certification by id. Cached. Throws 404 if missing. */
export async function getCertificationById(
  id: string,
): Promise<Certification> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.certification.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Certification '${id}' not found`);
      return toDomain(row);
    },
    CACHE_TTL.certificationDetail,
  );
}

/** Verify a certification by its verify code. Cached. Throws 404 if missing. */
export async function verifyCertification(
  code: string,
): Promise<EarnedCertification> {
  return cacheWrap(
    verifyKey(code),
    () => {
      const found = earned.find((e) => e.verifyCode === code);
      if (!found) {
        throw AppError.notFound(
          `No certification found for verify code '${code}'`,
        );
      }
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.certificationVerify,
  );
}

/**
 * Submit an exam for a certification — returns the score and, if
 * passed, a new `EarnedCertification` entry with a verification code.
 * Persists a `CertificationAttempt` row for record-keeping.
 */
export async function submitExam(input: {
  certificationId: string;
  userId: string;
  userName: string;
  answers: number[];
}): Promise<{
  certificationId: string;
  userId: string;
  score: number;
  passed: boolean;
  earned: EarnedCertification | null;
}> {
  const cert = await getCertificationById(input.certificationId);
  const questions = SEED_QUESTIONS[cert.id] ?? [];
  if (questions.length === 0) {
    throw AppError.badRequest(
      `No exam questions available for certification '${cert.id}'`,
    );
  }
  if (input.answers.length !== questions.length) {
    throw AppError.badRequest(
      `Expected ${questions.length} answers, received ${input.answers.length}`,
    );
  }

  let correct = 0;
  questions.forEach((q, i) => {
    if (input.answers[i] === q.correctIndex) correct += 1;
  });
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= cert.passingScore;

  // Persist the attempt regardless of pass/fail.
  await db.certificationAttempt.create({
    data: {
      userId: input.userId,
      certificationId: cert.id,
      score,
      passed,
      completedAt: new Date(),
    },
  });

  let earnedRecord: EarnedCertification | null = null;
  if (passed) {
    const now = new Date().toISOString();
    const expires = new Date(
      Date.now() + 3 * 365 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const verifyCode = `ROY-${input.userName.toUpperCase().replace(/[^A-Z]/g, "X").slice(0, 6)}-${new Date().getFullYear()}-${cert.level.toUpperCase().slice(0, 5)}-${score}`;
    earnedRecord = {
      id: `earned-${randomUUID()}`,
      certificationId: cert.id,
      userId: input.userId,
      userName: input.userName,
      score,
      issuedAt: now,
      expiresAt: expires,
      verifyCode,
    };
    earned.push(earnedRecord);
    invalidateVerify(verifyCode);
  }

  log.info("Certification exam submitted", {
    certificationId: cert.id,
    userId: input.userId,
    score,
    passed,
  });
  return {
    certificationId: cert.id,
    userId: input.userId,
    score,
    passed,
    earned: earnedRecord,
  };
}

/** Number of certifications in the store. */
export function certificationsCount(): number {
  return SEED_CERTIFICATIONS.length;
}

/** Test-only: reset earned list to seed. */
export function _resetCertificationsForTest(): void {
  earned = SEED_EARNED.map((e) => ({ ...e }));
  earned.forEach((e) => invalidateVerify(e.verifyCode));
}

log.debug("Certifications module loaded", {
  certifications: SEED_CERTIFICATIONS.length,
  earned: SEED_EARNED.length,
});
