/**
 * Live service — Roy Live (real-time collaborative sessions).
 *
 * Mock backend (no DB). Seeds 2 live sessions, 3 users per session,
 * and a handful of seeded messages. Posting a message appends to the
 * session and bumps its `updatedAt`.
 *
 * Reads are LRU-cached; message-post and session-create mutate state
 * and invalidate the affected caches.
 *
 * Future: persist via Prisma `LiveSession`/`LiveMessage` models and
 * broadcast mutations over a WebSocket gateway.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { LiveMessage, LiveSession, LiveUser } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type {
  CreateSessionInput,
  PostMessageInput,
} from "./schema.js";

const log = createLogger("live");

const sessionKey = (id: string): string => `live:session:${id}`;
const usersKey = (id: string): string => `live:session:${id}:users`;
const messagesKey = (id: string): string => `live:session:${id}:messages`;

function invalidateSession(id: string): void {
  cache.delete(sessionKey(id));
  cache.delete(usersKey(id));
  cache.delete(messagesKey(id));
}

// ─── Seed: 2 sessions, 3 users each, with messages ─────────────────────
const SEED_SESSIONS: LiveSession[] = [
  {
    id: "live-sess-aurora",
    title: "Aurora marketing — homepage rebuild",
    hostId: "user-roy",
    active: true,
    createdAt: "2025-02-19T07:00:00.000Z",
    updatedAt: "2025-02-19T08:30:00.000Z",
    cursors: [
      { userId: "user-roy", x: 320, y: 540, selection: "hero-title" },
      { userId: "user-mira", x: 920, y: 220, selection: null },
      { userId: "user-asha", x: 120, y: 980, selection: "cta-button" },
    ],
  },
  {
    id: "live-sess-medtech",
    title: "MedTech dashboard — accessibility audit",
    hostId: "user-priya",
    active: false,
    createdAt: "2025-02-18T16:00:00.000Z",
    updatedAt: "2025-02-18T17:15:00.000Z",
    cursors: [
      { userId: "user-priya", x: 0, y: 0, selection: null },
      { userId: "user-devon", x: 0, y: 0, selection: null },
      { userId: "user-roy", x: 0, y: 0, selection: null },
    ],
  },
];

const SEED_USERS: Record<string, LiveUser[]> = {
  "live-sess-aurora": [
    { id: "user-roy", name: "Roy", handle: "@roy", color: "#10b981", role: "host", joinedAt: "2025-02-19T07:00:00.000Z" },
    { id: "user-mira", name: "Mira Chen", handle: "@miracss", color: "#6366f1", role: "editor", joinedAt: "2025-02-19T07:04:00.000Z" },
    { id: "user-asha", name: "Asha Patel", handle: "@ashadev", color: "#ec4899", role: "editor", joinedAt: "2025-02-19T07:08:00.000Z" },
  ],
  "live-sess-medtech": [
    { id: "user-priya", name: "Priya Rao", handle: "@priyar", color: "#0ea5e9", role: "host", joinedAt: "2025-02-18T16:00:00.000Z" },
    { id: "user-devon", name: "Devon Park", handle: "@devp", color: "#f59e0b", role: "editor", joinedAt: "2025-02-18T16:05:00.000Z" },
    { id: "user-roy", name: "Roy", handle: "@roy", color: "#10b981", role: "viewer", joinedAt: "2025-02-18T16:30:00.000Z" },
  ],
};

const SEED_MESSAGES: Record<string, LiveMessage[]> = {
  "live-sess-aurora": [
    { id: "msg-001", sessionId: "live-sess-aurora", userId: "user-roy", content: "Let's ship the hero rebuild today.", ts: "2025-02-19T07:05:00.000Z" },
    { id: "msg-002", sessionId: "live-sess-aurora", userId: "user-mira", content: "I'm on the new fade-in-up animation.", ts: "2025-02-19T07:12:00.000Z" },
    { id: "msg-003", sessionId: "live-sess-aurora", userId: "user-asha", content: "Need to double-check contrast on the CTA.", ts: "2025-02-19T07:25:00.000Z" },
    { id: "msg-004", sessionId: "live-sess-aurora", userId: "user-roy", content: "Looks great — deploying in 10.", ts: "2025-02-19T08:28:00.000Z" },
  ],
  "live-sess-medtech": [
    { id: "msg-101", sessionId: "live-sess-medtech", userId: "user-priya", content: "Starting the a11y audit on the records grid.", ts: "2025-02-18T16:02:00.000Z" },
    { id: "msg-102", sessionId: "live-sess-medtech", userId: "user-devon", content: "Found 2 missing label associations.", ts: "2025-02-18T16:18:00.000Z" },
    { id: "msg-103", sessionId: "live-sess-medtech", userId: "user-roy", content: "Nice catch — patching now.", ts: "2025-02-18T17:14:00.000Z" },
  ],
};

let sessions: LiveSession[] = SEED_SESSIONS.map((s) => ({
  ...s,
  cursors: s.cursors.map((c) => ({ ...c })),
}));
const users: Record<string, LiveUser[]> = Object.fromEntries(
  Object.entries(SEED_USERS).map(([k, v]) => [k, v.map((u) => ({ ...u }))]),
);
const messages: Record<string, LiveMessage[]> = Object.fromEntries(
  Object.entries(SEED_MESSAGES).map(([k, v]) => [k, v.map((m) => ({ ...m }))]),
);

function requireSession(id: string): LiveSession {
  const found = sessions.find((s) => s.id === id);
  if (!found) throw AppError.notFound(`Live session '${id}' not found`);
  return found;
}

/** Create a new live session. */
export async function createLiveSession(
  input: CreateSessionInput,
): Promise<LiveSession> {
  const id = `live-sess-${randomUUID()}`;
  const now = new Date().toISOString();
  const session: LiveSession = {
    id,
    title: input.title,
    hostId: input.hostId,
    active: true,
    createdAt: now,
    updatedAt: now,
    cursors: [],
  };
  sessions = [session, ...sessions];
  users[id] = [
    {
      id: input.hostId,
      name: input.hostName ?? input.hostId,
      handle: `@${input.hostId}`,
      color: "#10b981",
      role: "host",
      joinedAt: now,
    },
  ];
  messages[id] = [];
  invalidateSession(id);
  log.info("Live session created", { id, title: input.title });
  return session;
}

/** Get a single live session by id. Throws 404 if missing. */
export async function getLiveSessionById(id: string): Promise<LiveSession> {
  return cacheWrap(
    sessionKey(id),
    () => {
      const found = requireSession(id);
      return Promise.resolve({
        ...found,
        cursors: found.cursors.map((c) => ({ ...c })),
      });
    },
    CACHE_TTL.liveSessionDetail,
  );
}

/** List users in a live session. */
export async function getSessionUsers(id: string): Promise<LiveUser[]> {
  return cacheWrap(
    usersKey(id),
    () => {
      requireSession(id);
      const list = users[id] ?? [];
      return Promise.resolve(list.map((u) => ({ ...u })));
    },
    CACHE_TTL.liveSessionUsers,
  );
}

/** List messages in a live session. */
export async function getSessionMessages(
  id: string,
): Promise<LiveMessage[]> {
  return cacheWrap(
    messagesKey(id),
    () => {
      requireSession(id);
      const list = messages[id] ?? [];
      return Promise.resolve(list.map((m) => ({ ...m })));
    },
    CACHE_TTL.liveSessionMessages,
  );
}

/** Post a message into a live session. */
export async function postSessionMessage(
  id: string,
  input: PostMessageInput,
): Promise<LiveMessage> {
  requireSession(id);
  const message: LiveMessage = {
    id: `msg-${randomUUID()}`,
    sessionId: id,
    userId: input.userId,
    content: input.content,
    ts: new Date().toISOString(),
  };
  const list = messages[id] ?? [];
  messages[id] = [...list, message];
  sessions = sessions.map((s) =>
    s.id === id ? { ...s, updatedAt: message.ts } : s,
  );
  invalidateSession(id);
  log.info("Live message posted", { sessionId: id, userId: input.userId });
  return message;
}

/** Test-only: reset to seed. */
export function _resetLiveForTest(): void {
  sessions = SEED_SESSIONS.map((s) => ({
    ...s,
    cursors: s.cursors.map((c) => ({ ...c })),
  }));
  for (const [k, v] of Object.entries(SEED_USERS)) {
    users[k] = v.map((u) => ({ ...u }));
  }
  for (const [k, v] of Object.entries(SEED_MESSAGES)) {
    messages[k] = v.map((m) => ({ ...m }));
  }
  for (const s of sessions) invalidateSession(s.id);
}
