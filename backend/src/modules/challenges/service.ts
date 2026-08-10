/**
 * Challenges service — in-memory Roy Challenges catalog + leaderboard.
 *
 * Mock backend (no DB). Seeds 8 challenges across difficulty levels and
 * 10 leaderboard entries. All reads are LRU-cached; submitting a
 * solution invalidates the leaderboard cache so the new entry appears
 * on subsequent reads.
 *
 * Future: swap the in-memory state for a Prisma `Challenge` /
 * `ChallengeSubmission` model backed by an in-browser code-runner that
 * posts results to the API.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  Challenge,
  ChallengeLeaderboardEntry,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("challenges");

const LIST_KEY = "challenges:list";
const detailKey = (id: string): string => `challenge:${id}`;
const LEADERBOARD_KEY = "challenges:leaderboard";

function invalidateLeaderboard(): void {
  cache.delete(LEADERBOARD_KEY);
}

// ─── Seed: 8 challenges ──────────────────────────────────────────────────
const SEED_CHALLENGES: Challenge[] = [
  {
    id: "ch-flex-center",
    title: "Center a Box with Flexbox",
    description: "Center a 200x200 box both horizontally and vertically using flexbox.",
    difficulty: "easy",
    category: "layout",
    timeLimit: 10,
    participants: 4_812,
    completionRate: 0.82,
    xpReward: 50,
  },
  {
    id: "ch-grid-template",
    title: "Holy Grail Layout with Grid",
    description: "Recreate the holy grail layout using CSS Grid template areas.",
    difficulty: "medium",
    category: "layout",
    timeLimit: 20,
    participants: 2_114,
    completionRate: 0.61,
    xpReward: 120,
  },
  {
    id: "ch-anim-bounce",
    title: "Bounce Animation",
    description: "Create a bounce keyframe animation that loops infinitely.",
    difficulty: "easy",
    category: "animation",
    timeLimit: 10,
    participants: 3_202,
    completionRate: 0.78,
    xpReward: 60,
  },
  {
    id: "ch-contrast-fix",
    title: "Fix the Contrast",
    description: "Identify and fix all WCAG AA contrast violations on a sample page.",
    difficulty: "medium",
    category: "accessibility",
    timeLimit: 15,
    participants: 1_488,
    completionRate: 0.54,
    xpReward: 110,
  },
  {
    id: "ch-container-query",
    title: "Responsive Card with Container Queries",
    description: "Make a card component adapt to its container width, not the viewport.",
    difficulty: "hard",
    category: "responsive",
    timeLimit: 30,
    participants: 612,
    completionRate: 0.41,
    xpReward: 200,
  },
  {
    id: "ch-cascade-layers",
    title: "Tame Specificity with @layer",
    description: "Refactor a stylesheet that uses !important into clean @layer declarations.",
    difficulty: "hard",
    category: "architecture",
    timeLimit: 25,
    participants: 428,
    completionRate: 0.36,
    xpReward: 220,
  },
  {
    id: "ch-sticky-header",
    title: "Sticky Header with Backdrop Blur",
    description: "Build a sticky header with a frosted-glass backdrop-filter effect.",
    difficulty: "medium",
    category: "ui",
    timeLimit: 18,
    participants: 1_904,
    completionRate: 0.58,
    xpReward: 130,
  },
  {
    id: "ch-scroll-snap",
    title: "Image Carousel with Scroll Snap",
    description: "Build a horizontal carousel using scroll-snap with keyboard navigation.",
    difficulty: "expert",
    category: "ui",
    timeLimit: 40,
    participants: 312,
    completionRate: 0.28,
    xpReward: 300,
  },
];

// ─── Seed: 10 leaderboard entries ────────────────────────────────────────
const SEED_LEADERBOARD: ChallengeLeaderboardEntry[] = [
  { rank: 1, userId: "u-1", name: "Aria K.", score: 9_820, solved: 8, totalTime: 4_120_000, avatar: "https://avatars.roycss.dev/u-1.png" },
  { rank: 2, userId: "u-2", name: "Ben L.", score: 9_610, solved: 8, totalTime: 4_580_000, avatar: "https://avatars.roycss.dev/u-2.png" },
  { rank: 3, userId: "u-3", name: "Cleo M.", score: 9_400, solved: 7, totalTime: 3_980_000, avatar: "https://avatars.roycss.dev/u-3.png" },
  { rank: 4, userId: "u-4", name: "Devon R.", score: 9_180, solved: 7, totalTime: 4_220_000, avatar: "https://avatars.roycss.dev/u-4.png" },
  { rank: 5, userId: "u-5", name: "Emi S.", score: 8_940, solved: 7, totalTime: 4_580_000, avatar: "https://avatars.roycss.dev/u-5.png" },
  { rank: 6, userId: "u-6", name: "Felix T.", score: 8_720, solved: 6, totalTime: 3_880_000, avatar: "https://avatars.roycss.dev/u-6.png" },
  { rank: 7, userId: "u-7", name: "Gia V.", score: 8_510, solved: 6, totalTime: 4_120_000, avatar: "https://avatars.roycss.dev/u-7.png" },
  { rank: 8, userId: "u-8", name: "Hari W.", score: 8_290, solved: 6, totalTime: 4_460_000, avatar: "https://avatars.roycss.dev/u-8.png" },
  { rank: 9, userId: "u-9", name: "Iris Y.", score: 8_080, solved: 5, totalTime: 3_720_000, avatar: "https://avatars.roycss.dev/u-9.png" },
  { rank: 10, userId: "u-10", name: "Jules Z.", score: 7_860, solved: 5, totalTime: 4_020_000, avatar: "https://avatars.roycss.dev/u-10.png" },
];

let leaderboard: ChallengeLeaderboardEntry[] = SEED_LEADERBOARD.map((e) => ({
  ...e,
}));

/** List all challenges. Cached. */
export async function listChallenges(): Promise<Challenge[]> {
  return cacheWrap(
    LIST_KEY,
    () => Promise.resolve(SEED_CHALLENGES.map((c) => ({ ...c }))),
    CACHE_TTL.challengesList,
  );
}

/** Get a single challenge by id. Cached. Throws 404 if missing. */
export async function getChallengeById(id: string): Promise<Challenge> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = SEED_CHALLENGES.find((c) => c.id === id);
      if (!found) throw AppError.notFound(`Challenge '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.challengeDetail,
  );
}

/** List the leaderboard. Cached. */
export async function getLeaderboard(): Promise<ChallengeLeaderboardEntry[]> {
  return cacheWrap(
    LEADERBOARD_KEY,
    () => Promise.resolve(leaderboard.map((e) => ({ ...e }))),
    CACHE_TTL.challengeLeaderboard,
  );
}

/**
 * Submit a solution for a challenge — returns the computed score and
 * invalidates the leaderboard cache so the next read reflects the
 * updated rankings (mock: deterministic scoring based on pass/fail).
 */
export async function submitSolution(input: {
  challengeId: string;
  userId: string;
  code: string;
  passed: boolean;
  timeMs?: number;
}): Promise<{
  challengeId: string;
  userId: string;
  passed: boolean;
  score: number;
  submittedAt: string;
}> {
  const challenge = await getChallengeById(input.challengeId);
  const submittedAt = new Date().toISOString();
  const baseScore = input.passed ? challenge.xpReward : 0;
  const timeBonus = input.passed && input.timeMs
    ? Math.max(0, Math.round((challenge.timeLimit * 60_000 - input.timeMs) / 1_000))
    : 0;
  const score = baseScore + timeBonus;

  if (input.passed) {
    // Insert/merge into the leaderboard (mock: bump the user's score).
    const existing = leaderboard.find((e) => e.userId === input.userId);
    if (existing) {
      existing.score += score;
      existing.solved += 1;
    } else {
      leaderboard.push({
        rank: 0, // re-sorted below
        userId: input.userId,
        name: input.userId,
        score,
        solved: 1,
        totalTime: input.timeMs ?? 0,
        avatar: `https://avatars.roycss.dev/${input.userId}.png`,
      });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((e, i) => {
      e.rank = i + 1;
    });
    leaderboard = leaderboard.slice(0, 20);
    invalidateLeaderboard();
  }

  log.info("Challenge solution submitted", {
    challengeId: input.challengeId,
    userId: input.userId,
    passed: input.passed,
    score,
  });
  return {
    challengeId: input.challengeId,
    userId: input.userId,
    passed: input.passed,
    score,
    submittedAt,
  };
}

/** Number of challenges in the store. */
export function challengesCount(): number {
  return SEED_CHALLENGES.length;
}

/** Test-only: reset leaderboard to seed. */
export function _resetChallengesForTest(): void {
  leaderboard = SEED_LEADERBOARD.map((e) => ({ ...e }));
  invalidateLeaderboard();
}

log.debug("Challenges module loaded", {
  challenges: SEED_CHALLENGES.length,
  leaderboard: SEED_LEADERBOARD.length,
});
