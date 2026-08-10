/**
 * Pair service — Roy Pair mock AI pair-programming assistant.
 *
 * Mock backend (no DB). Seeds 5 proactive suggestions and 3 historical
 * chat sessions. Each chat message produces a deterministic, repeatable
 * reply derived from the message hash — the same message returns the
 * same reply so the cache is coherent.
 *
 * Reads are LRU-cached; sending a message invalidates the history list.
 *
 * Future: route to an LLM with tool-calling emitting the same shape.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  PairMessage,
  PairSession,
  PairSuggestion,
} from "../../types/index.js";
import type { PairChatInput } from "./schema.js";

const log = createLogger("pair");

const HISTORY_KEY = "pair:history";
const SUGGESTIONS_KEY = "pair:suggestions";
const sessionKey = (id: string): string => `pair:session:${id}`;

function invalidateHistory(sessionId?: string): void {
  cache.delete(HISTORY_KEY);
  if (sessionId) cache.delete(sessionKey(sessionId));
}

// ─── Seed: 5 proactive suggestions ───────────────────────────────────────
const SEED_SUGGESTIONS: PairSuggestion[] = [
  {
    id: "sgt-extract-component",
    title: "Extract repeated JSX into a component",
    description:
      "Three places in your file render the same card markup. Extracting a <Card> component will reduce duplication.",
    category: "refactor",
    language: "tsx",
    codeSnippet:
      "function Card({ title, children }) {\n  return <div className=\"roycss-card\"><h3>{title}</h3>{children}</div>;\n}",
  },
  {
    id: "sgt-add-test",
    title: "Add a unit test for the new utility",
    description:
      "Your `formatDate` helper has no coverage. Adding a snapshot test will catch regressions in locale handling.",
    category: "test",
    language: "typescript",
    codeSnippet:
      "test('formatDate formats ISO date', () => {\n  expect(formatDate('2025-01-01')).toMatchInlineSnapshot();\n});",
  },
  {
    id: "sgt-memoize",
    title: "Wrap the expensive list in useMemo",
    description:
      "The filtered+sorted list re-runs on every render. Memoize to skip re-computation when inputs are unchanged.",
    category: "performance",
    language: "tsx",
    codeSnippet:
      "const visible = useMemo(() => items.filter(filter).sort(sort), [items, filter, sort]);",
  },
  {
    id: "sgt-sanitize-input",
    title: "Sanitize user input before rendering",
    description:
      "Your input is rendered with dangerouslySetInnerHTML. Run it through a sanitizer first to prevent XSS.",
    category: "security",
    language: "tsx",
    codeSnippet:
      "import DOMPurify from 'dompurify';\nconst safe = DOMPurify.sanitize(userHtml);",
  },
  {
    id: "sgt-named-export",
    title: "Prefer a named export",
    description:
      "Switching to a named export makes the symbol easier to refactor and tree-shake.",
    category: "style",
    language: "typescript",
    codeSnippet: "export function formatDate(date: Date): string { ... }",
  },
];

const suggestions: PairSuggestion[] = SEED_SUGGESTIONS.map((s) => ({ ...s }));

// ─── Seed: 3 chat history entries (sessions) ─────────────────────────────
const SEED_SESSIONS: PairSession[] = [
  {
    id: "pair-session-seed-1",
    title: "Set up the user model",
    language: "typescript",
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "How should I model a user with multiple roles?",
        timestamp: "2025-02-08T10:00:00.000Z",
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "A user can have a `roles: Role[]` array, where `Role` is a string union. This scales better than a bitmask and stays type-safe.",
        timestamp: "2025-02-08T10:00:05.000Z",
      },
    ],
    createdAt: "2025-02-08T10:00:00.000Z",
    updatedAt: "2025-02-08T10:00:05.000Z",
  },
  {
    id: "pair-session-seed-2",
    title: "Debug useEffect infinite loop",
    language: "tsx",
    messages: [
      {
        id: "msg-3",
        role: "user",
        content: "My useEffect keeps firing. What am I missing?",
        timestamp: "2025-02-10T14:22:00.000Z",
      },
      {
        id: "msg-4",
        role: "assistant",
        content:
          "Check your dependency array — if you pass a new object/array literal each render, React sees it as changed. Extract to a useMemo or useCallback.",
        timestamp: "2025-02-10T14:22:08.000Z",
      },
    ],
    createdAt: "2025-02-10T14:22:00.000Z",
    updatedAt: "2025-02-10T14:22:08.000Z",
  },
  {
    id: "pair-session-seed-3",
    title: "Pick a state library",
    language: "typescript",
    messages: [
      {
        id: "msg-5",
        role: "user",
        content: "Zustand vs Redux Toolkit for a mid-size app?",
        timestamp: "2025-02-12T09:15:00.000Z",
      },
      {
        id: "msg-6",
        role: "assistant",
        content:
          "For mid-size apps, Zustand's smaller boilerplate usually wins. Reach for Redux Toolkit if you need time-travel debugging or middleware-heavy side-effect pipelines.",
        timestamp: "2025-02-12T09:15:10.000Z",
      },
    ],
    createdAt: "2025-02-12T09:15:00.000Z",
    updatedAt: "2025-02-12T09:15:10.000Z",
  },
];

let sessions: PairSession[] = SEED_SESSIONS.map((s) => ({ ...s }));

/** List all chat history (sessions). Cached. */
export async function listHistory(): Promise<PairSession[]> {
  return cacheWrap(
    HISTORY_KEY,
    () => Promise.resolve(sessions.map((s) => ({ ...s }))),
    CACHE_TTL.pairHistory,
  );
}

/** List all proactive suggestions. Cached. */
export async function listSuggestions(): Promise<PairSuggestion[]> {
  return cacheWrap(
    SUGGESTIONS_KEY,
    () => Promise.resolve(suggestions.map((s) => ({ ...s }))),
    CACHE_TTL.pairSuggestions,
  );
}

/** Deterministic hash → 32-bit int (for mock reply variance). */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const MOCK_REPLIES = [
  "Here's how I'd approach that: start by extracting the smallest testable unit, then add a test, then add the next layer of behavior.",
  "Good question. The pattern you're describing is a 'strategy' — define an interface, ship two implementations, and pick at runtime.",
  "I'd reach for a custom hook here. Encapsulate the side-effect + state, and the component shrinks to a couple of lines.",
  "Watch out for the dependency array. If you pass a new object literal each render, the effect will fire on every paint.",
  "Consider memoizing that — `useMemo` for values, `useCallback` for callbacks. Same inputs → same output, no extra render.",
  "That's a classic N+1. Batch the reads into a single `where id in (...)` and you'll see a 10x improvement.",
  "For accessibility, give the input a `<label htmlFor>` and the button an `aria-label` — screen readers will pick it up.",
  "I'd add a TypeScript discriminated union here so the compiler catches the missing case at build time.",
];

/** Send a message to Roy Pair (mock). Returns the assistant reply. */
export async function chat(
  input: PairChatInput,
): Promise<{ session: PairSession; reply: PairMessage }> {
  const now = new Date().toISOString();
  const userMessage: PairMessage = {
    id: `msg-${randomUUID()}`,
    role: "user",
    content: input.message,
    timestamp: now,
  };

  // Find or create a session.
  let session = input.sessionId
    ? sessions.find((s) => s.id === input.sessionId)
    : undefined;
  let isNew = false;
  if (!session) {
    isNew = true;
    session = {
      id: `pair-session-${randomUUID()}`,
      title: input.message.slice(0, 60),
      language: input.language,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  const h = hashString(input.message + input.language);
  const reply: PairMessage = {
    id: `msg-${randomUUID()}`,
    role: "assistant",
    content: MOCK_REPLIES[h % MOCK_REPLIES.length]!,
    timestamp: new Date().toISOString(),
  };

  session = {
    ...session,
    messages: [...session.messages, userMessage, reply],
    updatedAt: reply.timestamp,
  };

  if (isNew) {
    sessions = [session, ...sessions].slice(0, 50);
  } else {
    sessions = sessions.map((s) => (s.id === session!.id ? session! : s));
  }
  invalidateHistory(session.id);
  log.info("Pair reply sent", { sessionId: session.id, isNew });
  return { session, reply };
}

/** Number of suggestions in the catalog. */
export function suggestionsCount(): number {
  return suggestions.length;
}

/** Test-only: reset sessions to seed. */
export function _resetPairForTest(): void {
  sessions = SEED_SESSIONS.map((s) => ({ ...s }));
  invalidateHistory();
}
