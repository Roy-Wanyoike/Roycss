/**
 * Academy service — in-memory learning-path store.
 *
 * Mock backend (no DB). Seeds 4 certification paths (Associate,
 * Professional, Expert, Architect), each with their own lesson list.
 * Progress updates mutate the in-memory lesson.completed flag.
 *
 * Reads are LRU-cached; writes invalidate the affected path entry.
 *
 * Future: persist progress against the authenticated user via Prisma.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { LearningPath } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ProgressInput } from "./schema.js";

const log = createLogger("academy");

const listKey = "paths:list";
const detailKey = (id: string): string => `path:${id}`;

function invalidate(id?: string): void {
  cache.delete(listKey);
  if (id) cache.delete(detailKey(id));
}

// ─── Seed: 4 certification paths ─────────────────────────────────────────
const SEED_PATHS: LearningPath[] = [
  {
    id: "path-associate",
    name: "RoyCSS Associate",
    level: "Associate",
    duration: 480, // 8h
    price: 0,
    certificationId: "cert-associate",
    lessons: [
      { id: "l-assoc-1", title: "Welcome to RoyCSS", type: "video", duration: 12, completed: false },
      { id: "l-assoc-2", title: "Installing the CLI", type: "lab", duration: 25, completed: false },
      { id: "l-assoc-3", title: "Effect classes 101", type: "reading", duration: 35, completed: false },
      { id: "l-assoc-4", title: "Recipe fundamentals", type: "reading", duration: 40, completed: false },
      { id: "l-assoc-5", title: "Building your first card", type: "lab", duration: 50, completed: false },
      { id: "l-assoc-6", title: "Associate knowledge check", type: "quiz", duration: 20, completed: false },
    ],
  },
  {
    id: "path-professional",
    name: "RoyCSS Professional",
    level: "Professional",
    duration: 900, // 15h
    price: 199,
    certificationId: "cert-professional",
    lessons: [
      { id: "l-pro-1", title: "Design tokens deep dive", type: "video", duration: 30, completed: false },
      { id: "l-pro-2", title: "Theme architecture", type: "reading", duration: 45, completed: false },
      { id: "l-pro-3", title: "Pattern composition", type: "lab", duration: 60, completed: false },
      { id: "l-pro-4", title: "Performance budgets", type: "reading", duration: 50, completed: false },
      { id: "l-pro-5", title: "Accessibility-first effects", type: "video", duration: 40, completed: false },
      { id: "l-pro-6", title: "Component library", type: "lab", duration: 90, completed: false },
      { id: "l-pro-7", title: "Cross-browser fallbacks", type: "reading", duration: 35, completed: false },
      { id: "l-pro-8", title: "Professional capstone", type: "lab", duration: 120, completed: false },
      { id: "l-pro-9", title: "Professional exam", type: "quiz", duration: 45, completed: false },
    ],
  },
  {
    id: "path-expert",
    name: "RoyCSS Expert",
    level: "Expert",
    duration: 1500, // 25h
    price: 399,
    certificationId: "cert-expert",
    lessons: [
      { id: "l-exp-1", title: "Runtime effect compilation", type: "video", duration: 45, completed: false },
      { id: "l-exp-2", title: "Container query systems", type: "reading", duration: 60, completed: false },
      { id: "l-exp-3", title: "View Transitions API", type: "lab", duration: 75, completed: false },
      { id: "l-exp-4", title: "Scroll-driven animations", type: "lab", duration: 90, completed: false },
      { id: "l-exp-5", title: "CSS Houdini worklets", type: "video", duration: 55, completed: false },
      { id: "l-exp-6", title: "Bundle optimization strategies", type: "reading", duration: 50, completed: false },
      { id: "l-exp-7", title: "Build a custom inspector", type: "lab", duration: 180, completed: false },
      { id: "l-exp-8", title: "Expert capstone", type: "lab", duration: 240, completed: false },
      { id: "l-exp-9", title: "Expert exam", type: "quiz", duration: 60, completed: false },
    ],
  },
  {
    id: "path-architect",
    name: "RoyCSS Architect",
    level: "Architect",
    duration: 2400, // 40h
    price: 799,
    certificationId: "cert-architect",
    lessons: [
      { id: "l-arch-1", title: "Platform architecture review", type: "video", duration: 60, completed: false },
      { id: "l-arch-2", title: "Multi-tenant theming", type: "reading", duration: 75, completed: false },
      { id: "l-arch-3", title: "Design system governance", type: "reading", duration: 90, completed: false },
      { id: "l-arch-4", title: "Effect libraries at scale", type: "lab", duration: 180, completed: false },
      { id: "l-arch-5", title: "Performance regression testing", type: "lab", duration: 150, completed: false },
      { id: "l-arch-6", title: "Migrating legacy CSS", type: "video", duration: 75, completed: false },
      { id: "l-arch-7", title: "RoyCSS in monorepos", type: "reading", duration: 60, completed: false },
      { id: "l-arch-8", title: "CI/CD for design systems", type: "lab", duration: 120, completed: false },
      { id: "l-arch-9", title: "Architecting team workflows", type: "reading", duration: 60, completed: false },
      { id: "l-arch-10", title: "Architect capstone", type: "lab", duration: 360, completed: false },
      { id: "l-arch-11", title: "Architect oral defense", type: "quiz", duration: 90, completed: false },
    ],
  },
];

let paths: LearningPath[] = SEED_PATHS.map((p) => ({
  ...p,
  lessons: p.lessons.map((l) => ({ ...l })),
}));

/** Summary shape used by GET /paths (no per-lesson detail). */
export interface PathSummary {
  id: string;
  name: string;
  level: LearningPath["level"];
  duration: number;
  price: number;
  certificationId: string;
  lessonsCount: number;
}

/** List all learning paths (without lesson detail). Cached. */
export async function listPaths(): Promise<PathSummary[]> {
  return cacheWrap(
    listKey,
    () =>
      Promise.resolve(
        paths.map<PathSummary>((p) => ({
          id: p.id,
          name: p.name,
          level: p.level,
          duration: p.duration,
          price: p.price,
          certificationId: p.certificationId,
          lessonsCount: p.lessons.length,
        })),
      ),
    CACHE_TTL.pathsList,
  );
}

/** Get a single path by id (full lesson list). Cached. */
export async function getPathById(id: string): Promise<LearningPath> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = paths.find((p) => p.id === id);
      if (!found) throw AppError.notFound(`Learning path '${id}' not found`);
      return Promise.resolve({
        ...found,
        lessons: found.lessons.map((l) => ({ ...l })),
      });
    },
    CACHE_TTL.pathDetail,
  );
}

/** Get only the lessons for a path. Cached as part of getPathById. */
export async function getLessonsForPath(
  id: string,
): Promise<LearningPath["lessons"]> {
  const path = await getPathById(id);
  return path.lessons;
}

/** Record progress on a lesson within a path. Invalidates path cache. */
export async function recordProgress(
  pathId: string,
  input: ProgressInput,
): Promise<{ lessonId: string; completed: boolean; completedLessons: number }> {
  const idx = paths.findIndex((p) => p.id === pathId);
  if (idx === -1) {
    throw AppError.notFound(`Learning path '${pathId}' not found`);
  }

  const path = paths[idx]!;
  const lesson = path.lessons.find((l) => l.id === input.lessonId);
  if (!lesson) {
    throw AppError.notFound(
      `Lesson '${input.lessonId}' not found in path '${pathId}'`,
    );
  }

  lesson.completed = input.completed;
  invalidate(pathId);

  const completedLessons = path.lessons.filter((l) => l.completed).length;
  log.info("Progress recorded", {
    pathId,
    lessonId: input.lessonId,
    completed: input.completed,
  });

  return {
    lessonId: input.lessonId,
    completed: input.completed,
    completedLessons,
  };
}

/** Number of paths in the store. */
export function pathsCount(): number {
  return paths.length;
}

/** Test-only: reset progress and seed. */
export function _resetPathsForTest(): void {
  paths = SEED_PATHS.map((p) => ({
    ...p,
    lessons: p.lessons.map((l) => ({ ...l })),
  }));
  invalidate();
}
