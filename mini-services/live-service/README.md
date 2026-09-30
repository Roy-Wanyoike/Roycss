# Roy Live — WebSocket Mini-Service

Real-time collaboration backend for the RoyCSS "Roy Live" feature
(a live-coding playground where multiple users edit CSS together).

## Run

```bash
bun install
bun run dev    # uses bun --hot for auto-restart on file changes
```

The service listens on **port 3003** (hardcoded — not from env).

## HTTP endpoints

| Method | Path       | Response                                          |
|--------|-----------|---------------------------------------------------|
| GET    | `/health` | `{ status: "ok", rooms, connections, connected, joined }` |

`/health` field semantics (#275 — additive; no field was removed):

- `connections` — sockets that have **joined a room** (legacy field, same
  meaning the endpoint always reported — kept for backward compatibility).
- `connected` — ALL sockets currently connected, joined or not.
- `joined` — the joined-socket count under an explicit, non-legacy name
  (same value as `connections`).

## Socket.io events

### Client → Server

| Event          | Payload                                                                          |
|----------------|----------------------------------------------------------------------------------|
| `join-room`    | `{ roomId: string, username: string }`                                           |
| `leave-room`   | `{ roomId: string }`                                                             |
| `code-change`  | `{ roomId: string, code: string, cursor?: CursorPayload \| null }`               |
| `cursor-move`  | `{ roomId: string, username: string, line: number, ch: number, color?: string }`|
| `chat-message` | `{ roomId: string, username: string, message: string, timestamp?: number }`     |
| `user-list`    | `{ roomId: string }`                                                             |

### Server → Client

| Event              | Payload                                                              |
|--------------------|----------------------------------------------------------------------|
| `room-state`       | `{ roomId, code, users, cursors, chatHistory }` (sent to joiner)    |
| `user-joined`      | `{ username, color, socketId }` (broadcast to others)               |
| `user-left`        | `{ username, color, socketId }` (broadcast to others)               |
| `code-updated`     | `{ code, cursor, socketId }` (broadcast to others, throttled 50ms)  |
| `cursor-moved`     | `{ socketId, username, line, ch, color }` (broadcast to others)     |
| `cursor-leave`     | `{ socketId, username }` (broadcast on disconnect / leave)          |
| `chat-received`    | `{ username, message, timestamp }` (broadcast to all in room)       |
| `user-list-response`| `{ roomId, users }`                                                 |
| `error-msg`        | `{ event, message }`                                                 |

## Hardening (#275)

All limits are constants in `server.ts` (each overridable per-instance via
`createLiveService()` options — the constants are the documented defaults)
and pinned by `tests/unit/live-service-hardening.test.ts` in the repo root.

- **`code` payload cap — 20,000 chars.** Playground code is a whole document,
  so the cap is deliberately larger than chat's 4,000 — but ~50× smaller than
  socket.io's 1 MB per-message default. Oversize `code-change` payloads are
  REJECTED with an `error-msg` event; nothing is stored, stashed, or
  rebroadcast.
- **Per-IP connection cap — 20 concurrent sockets** per remote address
  (`socket.handshake.address`). Over-cap handshakes fail with a
  `connect_error` ("connection limit reached …"). Trust model note: behind
  the Caddy gateway every address is the gateway's unless the proxy preserves
  client addresses — this is a memory/CPU bound, not abuse attribution.
- **Per-socket room cap — 5 joined rooms.** The current client model keeps
  ONE room per socket, so this is a defensive bound for future multi-room
  features. Rejected joins answer with an `error-msg` event.
- **CORS allowlist** — exact-match origin list. `LIVE_ALLOWED_ORIGINS`
  (comma-separated) REPLACES the default when set; the default keeps the dev
  flows working: `http://localhost:3000`, `http://localhost:3323`. Production
  MUST set it, e.g. `LIVE_ALLOWED_ORIGINS=https://roycss.com`. Enforced via
  engine.io `allowRequest` (covers polling AND websocket handshakes) plus
  CORS headers; requests without an `Origin` header (non-browser clients) are
  allowed.
- **Structured logging** — zero-dependency JSON-lines logger; every line is
  `{"ts":"…","level":"info|warn|error","msg":"…","scope":"live-service",…}`
  on stdout. `console.log` is gone.

## Features

- **Room management** — socket.io rooms keyed by `roomId`; joining returns the
  current snapshot (code, users, cursors, chat history).
- **Code sync** — server-side throttle, max 1 broadcast per 50ms per room,
  with a trailing-edge flush so the final keystroke always lands.
- **Cursor tracking** — per-socket cursors stored in-memory; `cursor-leave`
  fires on disconnect.
- **Presence** — `username → socketId` map per room; auto-assigned cursor
  colors from a 12-color palette.
- **Chat** — last 50 messages per room kept in an in-memory ring buffer;
  broadcast to everyone (including sender for confirmation).
- **Health** — `GET /health` returns live room + connection counts.

## Frontend connection pattern

This service sits behind the project's Caddy gateway. The Next.js client must
connect using the `XTransformPort` query convention (never a direct port):

```ts
import { io } from 'socket.io-client'

const socket = io('/?XTransformPort=3003', {
  transports: ['websocket', 'polling'],
})
```

## In-memory only

All state (rooms, users, cursors, chat history) lives in process memory and is
**not persisted**. Restarting the service clears everything. This is intentional
for the dev sandbox.
