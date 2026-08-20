/**
 * Live service — Prisma-backed Roy Live (real-time collaborative sessions).
 *
 * Persisted via the `LiveSession` + `LiveMessage` Prisma models. Seeds
 * 2 live sessions and a handful of seeded messages. Live users and
 * cursor positions remain static in-memory seeds (no Prisma models).
 *
 * Field-mapping: the Prisma `LiveSession` model exposes (slug, name,
 * ownerId, roomId, isPublic, maxUsers). The domain shape's `id ← slug`,
 * `title ← name`, `hostId ← ownerId` map directly; the extra fields
 * (active, cursors) are looked up from the static seed (keyed by id),
 * falling back to defaults for newly created sessions. The Prisma
 * `LiveMessage` model exposes (sessionId, userId, content, type,
 * createdAt). The domain shape's `id`, `sessionId`, `userId`, `content`
 * map directly; `ts ← createdAt.toISOString()`; `type` defaults to
 * "message".
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { LiveMessage, LiveSession, LiveUser } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type {
  CreateSessionInput,
  PostMessageInput,
} from "./schema.js";

const log = createLogger("live");

const SESSIONS_LIST_KEY = "live:sessions";
const sessionKey = (id: string): string => `live:session:${id}`;
const usersKey = (id: string): string => `live:session:${id}:users`;
const messagesKey = (id: string): string => `live:session:${id}:messages`;

function invalidateSession(id: string): void {
  cache.delete(SESSIONS_LIST_KEY);
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

// Lookup maps for the extra domain fields not in the Prisma schema.
const SESSION_EXTRAS = new Map<
  string,
  { active: boolean; updatedAt: string; cursors: LiveSession["cursors"] }
>(
  SEED_SESSIONS.map((s) => [
    s.id,
    { active: s.active, updatedAt: s.updatedAt, cursors: s.cursors },
  ]),
);
const USERS_LOOKUP = new Map<string, LiveUser[]>(
  Object.entries(SEED_USERS).map(([k, v]) => [k, v]),
);

function sessionToDb(s: LiveSession) {
  return {
    id: s.id,
    slug: s.id,
    name: s.title,
    ownerId: s.hostId,
    roomId: `room-${s.id}`,
    isPublic: true,
    maxUsers: 50,
  };
}

function sessionToDomain(row: {
  id: string;
  name: string;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): LiveSession {
  const extras = SESSION_EXTRAS.get(row.id) ?? {
    active: true,
    updatedAt: row.updatedAt.toISOString(),
    cursors: [],
  };
  return {
    id: row.id,
    title: row.name,
    hostId: row.ownerId ?? "",
    active: extras.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: extras.updatedAt,
    cursors: extras.cursors.map((c) => ({ ...c })),
  };
}

function messageToDb(m: LiveMessage) {
  return {
    id: m.id,
    sessionId: m.sessionId,
    userId: m.userId,
    content: m.content,
    type: "message",
  };
}

function messageToDomain(row: {
  id: string;
  sessionId: string;
  userId: string | null;
  content: string;
  type: string;
  createdAt: Date;
}): LiveMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId ?? "",
    content: row.content,
    ts: row.createdAt.toISOString(),
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    if ((await db.liveSession.count()) === 0) {
      await db.liveSession.createMany({
        data: SEED_SESSIONS.map(sessionToDb),
      });
    }
    if ((await db.liveMessage.count()) === 0) {
      const all = Object.values(SEED_MESSAGES).flat();
      await db.liveMessage.createMany({ data: all.map(messageToDb) });
    }
    log.info("Live seeded", {
      sessions: SEED_SESSIONS.length,
      messages: Object.values(SEED_MESSAGES).flat().length,
    });
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

async function requireSessionRow(id: string): Promise<LiveSession> {
  await seedIfEmpty();
  const row = await db.liveSession.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`Live session '${id}' not found`);
  return sessionToDomain(row);
}

/** List all live sessions. Cached. */
export async function listSessions(): Promise<LiveSession[]> {
  return cacheWrap(
    SESSIONS_LIST_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.liveSession.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(sessionToDomain);
    },
    CACHE_TTL.liveSessionDetail,
  );
}

/** Create a new live session. */
export async function createLiveSession(
  input: CreateSessionInput,
): Promise<LiveSession> {
  await seedIfEmpty();
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
  await db.liveSession.create({ data: sessionToDb(session) });
  // Track extras for the new session so reads round-trip correctly.
  SESSION_EXTRAS.set(id, {
    active: true,
    updatedAt: now,
    cursors: [],
  });
  USERS_LOOKUP.set(id, [
    {
      id: input.hostId,
      name: input.hostName ?? input.hostId,
      handle: `@${input.hostId}`,
      color: "#10b981",
      role: "host",
      joinedAt: now,
    },
  ]);
  invalidateSession(id);
  log.info("Live session created", { id, title: input.title });
  return session;
}

/** Get a single live session by id. Throws 404 if missing. */
export async function getLiveSessionById(id: string): Promise<LiveSession> {
  return cacheWrap(
    sessionKey(id),
    async () => requireSessionRow(id),
    CACHE_TTL.liveSessionDetail,
  );
}

/** List users in a live session. */
export async function getSessionUsers(id: string): Promise<LiveUser[]> {
  return cacheWrap(
    usersKey(id),
    async () => {
      await requireSessionRow(id);
      const list = USERS_LOOKUP.get(id) ?? [];
      return list.map((u) => ({ ...u }));
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
    async () => {
      await requireSessionRow(id);
      const rows = await db.liveMessage.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: "asc" },
      });
      return rows.map(messageToDomain);
    },
    CACHE_TTL.liveSessionMessages,
  );
}

/** Post a message into a live session. */
export async function postSessionMessage(
  id: string,
  input: PostMessageInput,
): Promise<LiveMessage> {
  await requireSessionRow(id);
  const message: LiveMessage = {
    id: `msg-${randomUUID()}`,
    sessionId: id,
    userId: input.userId,
    content: input.content,
    ts: new Date().toISOString(),
  };
  await db.liveMessage.create({ data: messageToDb(message) });
  // Bump the session's updatedAt extras tracker (in-memory only).
  const extras = SESSION_EXTRAS.get(id);
  if (extras) {
    extras.updatedAt = message.ts;
  }
  invalidateSession(id);
  log.info("Live message posted", { sessionId: id, userId: input.userId });
  return message;
}

/** Test-only: reset to seed. */
export function _resetLiveForTest(): void {
  seedPromise = null;
  for (const s of SEED_SESSIONS) invalidateSession(s.id);
}
