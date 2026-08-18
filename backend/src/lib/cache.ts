/**
 * In-memory LRU cache with TTL support.
 *
 * No Redis dependency for dev — production can swap this for an
 * ioredis-backed implementation that implements the same `Cache` shape.
 *
 * Implementation: a Map with insert-order iteration is used as the
 * underlying store (Maps preserve insertion order in JS), and on access
 * we delete + re-set the key so it becomes the most-recently-used.
 * This gives O(1) get/set and natural LRU eviction (oldest entries are
 * iterated first by Map.keys()).
 */
import { CACHE_MAX_ENTRIES } from "../config/constants.js";

export interface CacheEntry<V> {
  value: V;
  expiresAt: number; // epoch ms; 0 = never expires
}

export interface CacheOptions {
  /** Max entries before LRU eviction. Defaults to CACHE_MAX_ENTRIES. */
  maxEntries?: number;
}

export class LRUCache<V = unknown> {
  private readonly store = new Map<string, CacheEntry<V>>();
  private readonly maxEntries: number;

  constructor(options: CacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? CACHE_MAX_ENTRIES;
  }

  /** Get a value by key, or undefined if missing/expired. */
  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    // TTL check
    if (entry.expiresAt !== 0 && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    // Move to end (most-recently-used) by re-inserting.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  /** Set a value with an optional TTL (ms). ttl = 0 means never expires. */
  set(key: string, value: V, ttlMs = 0): void {
    // Ensure key doesn't already exist so insertion order is correct.
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    this.store.set(key, {
      value,
      expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0,
    });

    // Evict oldest entries until under the limit.
    while (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }

  /** Delete a single key. Returns true if it existed. */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /** Clear everything. */
  clear(): void {
    this.store.clear();
  }

  /** Current size (including entries that may be expired but not yet swept). */
  get size(): number {
    return this.store.size;
  }

  /**
   * Manually sweep expired entries. Called lazily by get() but useful
   * for periodic sweeps to bound memory between accesses.
   */
  sweepExpired(): number {
    let removed = 0;
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== 0 && entry.expiresAt < now) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /** Whether a key exists and is not expired. */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}

/**
 * Default singleton cache used across the app for effects/recipes/patterns.
 * Module-scoped caches can be created with `new LRUCache()` if isolation
 * is preferred.
 */
export const cache = new LRUCache<unknown>();

/**
 * Wrap a value-producing function with cache get/set semantics.
 *
 *   const list = await cache.wrap("effects:list", () => loadEffects(), 5 * 60_000)
 */
export async function cacheWrap<V>(
  key: string,
  producer: () => V | Promise<V>,
  ttlMs: number,
): Promise<V> {
  const hit = cache.get(key) as V | undefined;
  if (hit !== undefined) return hit;

  const value = await producer();
  cache.set(key, value as unknown, ttlMs);
  return value;
}
