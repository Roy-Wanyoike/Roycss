# ADR-003: React Hooks (No Global State Library)

## Status

Accepted (2025-01-15)

## Context

RoyCSS has 20+ sections rendered on a single page, 62 platform products, 64 developer tools, 1,809 effects, complex filtering, search, favorites, recent effects, copy history, theme, and an interactive tutorial. The question was whether to introduce a global state library (Redux Toolkit, Zustand, Jotai, Recoil) or stay with React's built-in primitives.

The data flow analysis:

- **Per-section local state** — each section (effects gallery, platform tabs, tools grid, docs) manages its own filter / tab / pagination state independently
- **Cross-section state** — only three pieces: favorites (set of effect IDs), recent effects (last N viewed), and theme (light/dark). Search overlay and docs viewer are independent sheets/drawers with their own open/close state
- **Persistence** — favorites, recents, and theme must survive page reload; copy history is bounded (last 50) and per-session
- **Server state** — backend API responses (AI playground, CSS doctor) are one-shot fetches, not long-lived caches that would justify TanStack Query

## Decision

Use **React's built-in hooks only** — `useState`, `useEffect`, `useMemo`, `useCallback` — with `localStorage` for persistence and `useSyncExternalStore` for the three cross-component stores (favorites, recents, theme). No Redux, Zustand, Jotai, Recoil, or TanStack Query is added to the dependency tree.

### Patterns

- **Local section state**: `useState` inside each section component (e.g., `const [activeCategory, setActiveCategory] = useState<EffectCategory | "all">("all")`)
- **Expensive derivations**: `useMemo` (e.g., filtering 1,809 effects by category + tag + search query)
- **Cross-component state**: a small `useSyncExternalStore`-backed store per concern
  - `src/hooks/use-favorites.ts` — favorites store (Set of effect IDs, persisted to `localStorage` under `roycss:favorites`)
  - Recents — managed in the orchestrator (`roycss-page.tsx`) and passed down via props
  - Theme — `next-themes` (lightweight, already a dependency of shadcn/ui)
- **One-shot fetches**: plain `async/await` inside `useEffect` (e.g., AI playground, CSS doctor API routes)

## Rationale

- **The app is a single-page experience** — all sections live on `/`; there is no router-driven state splitting
- **Cross-section communication is minimal** — only favorites, recents, and theme need to be read by more than one component
- **`localStorage` handles persistence** — favorites and recents are small (a few KB of IDs); no need for an IndexedDB-backed store
- **`useSyncExternalStore` is the right primitive** — it's React's official external-store hook, gives concurrent-safe reads, and avoids the context-propagation cost of Redux/Zustand
- **No time-travel debugging needed** — the state shape is small enough to reason about directly; dev tools `console.log` is sufficient
- **No middleware needed** — no async thunks, no sagas; one-shot fetches live inside `useEffect`

## Trade-offs

- **Pro**: Zero state-management dependencies, smaller bundle, simpler mental model, faster cold start
- **Pro**: No provider tree to wire (no `<ReduxProvider>`, no `<QueryClientProvider>`)
- **Pro**: Each section stays self-contained — easy to delete or refactor without touching a global store
- **Con**: No time-travel debugging — mitigated by React DevTools + `useSyncExternalStore`'s built-in snapshot logging
- **Con**: No middleware (logging, analytics) — where needed, it's added inside the hook (`useEffect` on favorites change → fire analytics event)
- **Con**: Cross-cutting concerns like "currently selected effect" must be threaded via props from the orchestrator — accepted; the prop drilling is one level deep and explicit

## Alternatives Considered

1. **Redux Toolkit** — rejected: the boilerplate (slice, reducer, provider, selector) exceeds the value for three pieces of cross-cutting state. Bundle would grow by ~3 KB gzipped.
2. **Zustand** — rejected: the most tempting alternative (small, hook-based), but still adds a dependency for a problem `useSyncExternalStore` already solves natively in React 18+.
3. **Jotai / Recoil (atomic state)** — rejected: atomic model shines for fine-grained reactivity in large forms; RoyCSS has no such forms.
4. **TanStack Query (server state)** — rejected: backend calls are one-shot AI generations with no caching value; a 30-second cache window for an AI migration result is wrong-by-default. Plain `fetch` inside `useEffect` is clearer.
5. **Context + useReducer** — partially adopted: the orchestrator uses `useState` and threads results via props rather than context, because the prop drilling is shallow and context re-renders would be more expensive than prop passing for the largest subtree (the effects gallery).
