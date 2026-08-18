"use client";

import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "roycss-favorites";
const FAV_EVENT = "roycss-favorites-change";

const EMPTY_SET = new Set<string>();

let cachedRaw: string | null | undefined = undefined;
let cachedSnapshot: Set<string> = EMPTY_SET;

function getSnapshot(): Set<string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedSnapshot;
  }
  cachedRaw = raw;
  try {
    cachedSnapshot = raw ? new Set(JSON.parse(raw) as string[]) : EMPTY_SET;
  } catch {
    cachedSnapshot = EMPTY_SET;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): Set<string> {
  return EMPTY_SET;
}

function subscribe(callback: () => void): () => void {
  const handler = () => {
    cachedRaw = undefined;
    callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(FAV_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(FAV_EVENT, handler);
  };
}

export function useFavorites() {
  const favorites = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const toggleFavorite = useCallback((id: string) => {
    const current = getSnapshot();
    const next = new Set(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
    cachedRaw = undefined;
    cachedSnapshot = next;
    window.dispatchEvent(new Event(FAV_EVENT));
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.has(id),
    [favorites]
  );

  const clearAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    cachedRaw = undefined;
    cachedSnapshot = EMPTY_SET;
    window.dispatchEvent(new Event(FAV_EVENT));
  }, []);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearAll,
    count: favorites.size,
  };
}
