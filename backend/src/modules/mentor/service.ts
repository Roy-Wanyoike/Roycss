/**
 * Mentor service — in-memory Roy Mentor topics / levels / progress store.
 *
 * Mock backend (no DB). Seeds 6 learning topics, 3 skill levels, and a
 * learner progress snapshot. All reads are LRU-cached; chat messages
 * return a deterministic mock response so the route layer stays simple.
 *
 * Future: swap the in-memory state for an LLM-backed mentor that streams
 * responses and persists conversation history in a Prisma `MentorSession`.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  MentorChatMessage,
  MentorLevel,
  MentorProgress,
  MentorTopic,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("mentor");

const TOPICS_KEY = "mentor:topics";
const LEVELS_KEY = "mentor:levels";
const PROGRESS_KEY = "mentor:progress";

// ─── Seed: 6 topics ──────────────────────────────────────────────────────
const SEED_TOPICS: MentorTopic[] = [
  {
    id: "topic-flexbox",
    title: "Mastering Flexbox",
    category: "layout",
    difficulty: "beginner",
    description: "Align, justify, and order items with flex containers.",
    lessonCount: 8,
  },
  {
    id: "topic-grid",
    title: "CSS Grid Layouts",
    category: "layout",
    difficulty: "intermediate",
    description: "Two-dimensional layouts with grid-template and grid-area.",
    lessonCount: 12,
  },
  {
    id: "topic-animations",
    title: "Advanced Animations",
    category: "animation",
    difficulty: "advanced",
    description: "Keyframes, motion paths, and scroll-driven animations.",
    lessonCount: 10,
  },
  {
    id: "topic-contrast",
    title: "Color & Contrast",
    category: "accessibility",
    difficulty: "beginner",
    description: "WCAG contrast ratios and accessible color palettes.",
    lessonCount: 6,
  },
  {
    id: "topic-container-queries",
    title: "Container Queries",
    category: "responsive",
    difficulty: "intermediate",
    description: "Responsive design based on container size, not viewport.",
    lessonCount: 7,
  },
  {
    id: "topic-cascade-layers",
    title: "Cascade Layers",
    category: "architecture",
    difficulty: "advanced",
    description: "Tame specificity wars with @layer declarations.",
    lessonCount: 5,
  },
];

// ─── Seed: 3 skill levels ────────────────────────────────────────────────
const SEED_LEVELS: MentorLevel[] = [
  {
    id: "level-1",
    name: "Apprentice",
    description: "New to CSS — learning the fundamentals.",
    xpRequired: 0,
    unlocks: ["topic-flexbox", "topic-contrast"],
  },
  {
    id: "level-2",
    name: "Practitioner",
    description: "Comfortable with day-to-day CSS work.",
    xpRequired: 500,
    unlocks: ["topic-grid", "topic-container-queries"],
  },
  {
    id: "level-3",
    name: "Architect",
    description: "Designing systems and taming the cascade.",
    xpRequired: 1_500,
    unlocks: ["topic-animations", "topic-cascade-layers"],
  },
];

// ─── Seed: learner progress snapshot ─────────────────────────────────────
const SEED_PROGRESS: MentorProgress = {
  level: 2,
  xp: 720,
  xpToNext: 780,
  streak: 12,
  completedTopics: 3,
  totalTopics: SEED_TOPICS.length,
  recentActivity: [
    {
      topicId: "topic-grid",
      title: "CSS Grid Layouts",
      ts: "2025-02-28T10:14:00.000Z",
    },
    {
      topicId: "topic-flexbox",
      title: "Mastering Flexbox",
      ts: "2025-02-27T16:42:00.000Z",
    },
    {
      topicId: "topic-contrast",
      title: "Color & Contrast",
      ts: "2025-02-26T09:18:00.000Z",
    },
  ],
};

/** List all mentor topics. Cached. */
export async function listTopics(): Promise<MentorTopic[]> {
  return cacheWrap(
    TOPICS_KEY,
    () => Promise.resolve(SEED_TOPICS.map((t) => ({ ...t }))),
    CACHE_TTL.mentorTopics,
  );
}

/** List all skill levels. Cached. */
export async function listLevels(): Promise<MentorLevel[]> {
  return cacheWrap(
    LEVELS_KEY,
    () =>
      Promise.resolve(
        SEED_LEVELS.map((l) => ({ ...l, unlocks: [...l.unlocks] })),
      ),
    CACHE_TTL.mentorLevels,
  );
}

/** Get learner progress. Cached. */
export async function getProgress(): Promise<MentorProgress> {
  return cacheWrap(
    PROGRESS_KEY,
    () =>
      Promise.resolve({
        ...SEED_PROGRESS,
        recentActivity: SEED_PROGRESS.recentActivity.map((a) => ({ ...a })),
      }),
    CACHE_TTL.mentorProgress,
  );
}

/**
 * Send a chat message to the mentor — returns the user message and a
 * deterministic mock mentor reply.
 *
 * Future: replace with an LLM-backed stream.
 */
export async function sendChat(input: {
  message: string;
  topicId?: string;
}): Promise<{ id: string; messages: MentorChatMessage[] }> {
  if (input.topicId) {
    const found = SEED_TOPICS.find((t) => t.id === input.topicId);
    if (!found) {
      throw AppError.notFound(`Mentor topic '${input.topicId}' not found`);
    }
  }
  const now = new Date().toISOString();
  const id = `mentor-chat-${randomUUID()}`;
  const messages: MentorChatMessage[] = [
    { role: "user", content: input.message, ts: now },
    {
      role: "mentor",
      content: buildMockReply(input.message, input.topicId),
      ts: now,
    },
  ];
  log.info("Mentor chat message sent", { id, topicId: input.topicId ?? "none" });
  return { id, messages };
}

function buildMockReply(message: string, topicId?: string): string {
  const topic = SEED_TOPICS.find((t) => t.id === topicId);
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return "Could you say a bit more about what you're trying to do?";
  }
  if (topic) {
    return `Great question about ${topic.title}! Start by reviewing the basics of ${topic.category}, then try the first ${Math.min(3, topic.lessonCount)} lessons. Want me to suggest a small exercise?`;
  }
  return `Got it — "${trimmed.slice(0, 80)}". I'd recommend starting with the Flexbox topic, then moving on to Grid. Want a 5-minute warm-up exercise?`;
}

/** Number of topics in the store. */
export function topicsCount(): number {
  return SEED_TOPICS.length;
}

log.debug("Mentor module loaded", {
  topics: SEED_TOPICS.length,
  levels: SEED_LEVELS.length,
});
