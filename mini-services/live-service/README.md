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
| GET    | `/health` | `{ status: "ok", rooms: <count>, connections: <count> }` |

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
