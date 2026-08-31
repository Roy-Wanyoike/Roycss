/**
 * Prisma client singleton — mirrors src/lib/db.ts.
 *
 * In dev (tsx watch / nodemon) the same module is re-imported on every
 * reload. Without a global singleton, Prisma opens a new connection pool
 * each time and the previous one is never closed, eventually exhausting
 * the SQLite file handles (or Postgres connections). The globalThis
 * stash prevents that leak.
 */
import { PrismaClient } from "@prisma/client";

import { IS_DEV } from "../config/constants.js";

const globalForPrisma = globalThis as unknown as {
  __roycssPrisma?: PrismaClient;
};

function createClient(): PrismaClient {
  return new PrismaClient({
    log: IS_DEV
      ? ["warn", "error"]
      : ["error"],
  });
}

export const db: PrismaClient = globalForPrisma.__roycssPrisma ?? createClient();

if (IS_DEV && !globalForPrisma.__roycssPrisma) {
  globalForPrisma.__roycssPrisma = db;
}

/**
 * Ping the database. Used by the /health endpoint to report DB status.
 * Returns true on success, false on failure (never throws).
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    // A trivial SELECT 1 — works on both SQLite and Postgres.
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** Graceful shutdown — close the connection pool. */
export async function closeDatabase(): Promise<void> {
  try {
    await db.$disconnect();
  } catch {
    // Ignore — we're shutting down anyway.
  }
}
