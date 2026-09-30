import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { Server, Socket } from 'socket.io'

// ---------- Tunable hardening limits (#275) ----------

// These are the SERVICE-WIDE defaults. Every limit is also accepted as a
// `createLiveService()` option so tests (and ops) can tune a specific
// deployment without forking the code — the defaults below are the pinned,
// documented contract (see README "Hardening").

/** Chat ring-buffer length per room (pre-existing behavior). */
export const CHAT_HISTORY_LIMIT = 50

/** Max characters stored/broadcast for a chat message (pre-existing). */
export const MESSAGE_MAX_LENGTH = 4000

/**
 * Max characters for a `code-change` payload (#275).
 *
 * 20,000 chars — deliberately larger than the chat cap (4,000) because
 * playground code is whole-document CSS/HTML, but still ~50x smaller than
 * socket.io's 1MB default per-message limit. Without this cap one client
 * could grow `room.code` (retained per room, re-sent to every joiner) and
 * each broadcast up to 1MB — bounded now, and the oversize payload is
 * REJECTED with an `error-msg` event (nothing is stored or rebroadcast).
 */
export const CODE_MAX_LENGTH = 20_000

/**
 * Max CONCURRENT sockets per remote address (#275), tracked via
 * `socket.handshake.address`. NOTE the trust model: behind the Caddy
 * gateway every remote address is the gateway's (127.0.0.1) unless the
 * proxy preserves client addresses (PROXY protocol / real-ip) — this cap
 * is a memory/CPU bound, not an abuse-attribution system.
 */
export const MAX_CONNECTIONS_PER_IP = 20

/**
 * Max rooms one socket may be joined to (#275). The current client model
 * keeps ONE room per socket (join-room leaves the previous room first),
 * so this cap is a defensive bound for future multi-room features — it
 * exists so adding multi-room cannot silently reintroduce unbounded state.
 */
export const MAX_ROOMS_PER_SOCKET = 5

/**
 * CORS allowlist when `LIVE_ALLOWED_ORIGINS` is unset (#275).
 *
 * localhost:3000 (Next.js dev) and localhost:3323 (sandbox dev server) so
 * the documented dev flows keep working. Production MUST set
 * `LIVE_ALLOWED_ORIGINS` (comma-separated, e.g.
 * `LIVE_ALLOWED_ORIGINS=https://roycss.com`) — when set, it REPLACES this
 * default (no implicit wildcard, no silent union).
 */
export const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3323',
]

export interface LiveServiceOptions {
  /** Max characters for `code-change` payloads. Default: CODE_MAX_LENGTH. */
  codeMaxLength?: number
  /** Max concurrent sockets per remote address. Default: MAX_CONNECTIONS_PER_IP. */
  maxConnectionsPerIp?: number
  /** Max rooms joined per socket. Default: MAX_ROOMS_PER_SOCKET. */
  maxRoomsPerSocket?: number
  /** Exact-match CORS origin allowlist. Default: parseAllowedOrigins(). */
  allowedOrigins?: string[]
}

/**
 * Resolve the origin allowlist from the environment (#275).
 *
 * `LIVE_ALLOWED_ORIGINS` — comma-separated exact origins. Unset/empty →
 * DEFAULT_ALLOWED_ORIGINS (dev). Entries are trimmed; empty entries are
 * dropped; a value that parses to nothing falls back to the default.
 */
export function parseAllowedOrigins(
  // `Record<string, string | undefined>` (not a Pick of ProcessEnv): Pick
  // over ProcessEnv's index signature yields a REQUIRED property, and an
  // optional-prop object literal type fails the weak-type check against
  // ProcessEnv. The record type accepts process.env, partial objects, {}.
  env: Record<string, string | undefined> = process.env,
): string[] {
  const raw = env.LIVE_ALLOWED_ORIGINS?.trim()
  if (!raw) return [...DEFAULT_ALLOWED_ORIGINS]
  const parsed = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
  return parsed.length > 0 ? parsed : [...DEFAULT_ALLOWED_ORIGINS]
}

// ---------- Minimal structured logger (zero dependencies, #275) ----------

export type LogLevel = 'info' | 'warn' | 'error'

export interface Logger {
  info(msg: string, ctx?: Record<string, unknown>): void
  warn(msg: string, ctx?: Record<string, unknown>): void
  error(msg: string, ctx?: Record<string, unknown>): void
}

/**
 * pino-style JSON-lines logger: one `{"ts","level","msg",...}` object per
 * line on stdout, plus a `scope` field naming the emitting component.
 * Console.log is gone from the service (#275) — everything flows through
 * here so log ingestion sees a single machine-readable format.
 */
export function createLogger(scope: string): Logger {
  const emit = (level: LogLevel, msg: string, ctx?: Record<string, unknown>): void => {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg,
      scope,
      ...ctx,
    })
    process.stdout.write(line + '\n')
  }
  return {
    info: (msg, ctx) => emit('info', msg, ctx),
    warn: (msg, ctx) => emit('warn', msg, ctx),
    error: (msg, ctx) => emit('error', msg, ctx),
  }
}

// ---------- Types ----------

interface RoomUser {
  socketId: string
  username: string
  color: string
}

interface CursorPayload {
  username: string
  line: number
  ch: number
  color: string
}

interface StoredCursor extends CursorPayload {
  socketId: string
}

interface ChatMessage {
  username: string
  message: string
  timestamp: number
}

interface RoomState {
  code: string
  users: Map<string, RoomUser>            // socketId -> user
  cursors: Map<string, StoredCursor>      // socketId -> cursor
  chatHistory: ChatMessage[]              // ring buffer (max 50)
  lastCodeBroadcastTs: number             // throttle timestamp (per-room)
  pendingCode: { code: string; cursor: CursorPayload | null } | null
  throttleTimer: NodeJS.Timeout | null
}

interface JoinRoomPayload {
  roomId: string
  username: string
}

interface CodeChangePayload {
  roomId: string
  code: string
  cursor?: CursorPayload | null
}

interface CursorMovePayload {
  roomId: string
  username: string
  line: number
  ch: number
  color?: string
}

interface ChatMessagePayload {
  roomId: string
  username: string
  message: string
  timestamp?: number
}

export interface LiveService {
  httpServer: ReturnType<typeof createServer>
  io: Server
  rooms: Map<string, RoomState>
  /** socketId -> roomId (sockets that have joined at least one room). */
  socketToRoom: Map<string, string>
  /** remote address -> socketIds currently connected (per-IP cap bookkeeping). */
  connectionsByIp: Map<string, Set<string>>
  /** The resolved limits for this instance (defaults or options). */
  limits: {
    codeMaxLength: number
    maxConnectionsPerIp: number
    maxRoomsPerSocket: number
  }
  allowedOrigins: string[]
  /** Close io + httpServer; resolves when the HTTP server is closed. */
  close(): Promise<void>
}

export function createLiveService(options: LiveServiceOptions = {}): LiveService {
  const limits = {
    codeMaxLength: options.codeMaxLength ?? CODE_MAX_LENGTH,
    maxConnectionsPerIp: options.maxConnectionsPerIp ?? MAX_CONNECTIONS_PER_IP,
    maxRoomsPerSocket: options.maxRoomsPerSocket ?? MAX_ROOMS_PER_SOCKET,
  }
  const allowedOrigins = options.allowedOrigins ?? parseAllowedOrigins()
  const log = createLogger('live-service')

  // ---------- In-memory state ----------

  const rooms = new Map<string, RoomState>()
  const socketToRoom = new Map<string, string>()
  const connectionsByIp = new Map<string, Set<string>>()

  const CURSOR_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#8b5cf6', '#ec4899', '#84cc16', '#14b8a6', '#a855f7',
    '#f43f5e', '#0ea5e9',
  ]

  function pickColor(): string {
    return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
  }

  function getOrCreateRoom(roomId: string): RoomState {
    let room = rooms.get(roomId)
    if (!room) {
      room = {
        code: '',
        users: new Map(),
        cursors: new Map(),
        chatHistory: [],
        lastCodeBroadcastTs: 0,
        pendingCode: null,
        throttleTimer: null,
      }
      rooms.set(roomId, room)
    }
    return room
  }

  function publicUsers(room: RoomState): RoomUser[] {
    return Array.from(room.users.values())
  }

  function publicCursors(room: RoomState): StoredCursor[] {
    return Array.from(room.cursors.values())
  }

  function leaveRoom(socket: Socket, roomId: string): void {
    const room = rooms.get(roomId)
    if (!room) {
      socketToRoom.delete(socket.id)
      return
    }

    const user = room.users.get(socket.id)

    room.users.delete(socket.id)
    room.cursors.delete(socket.id)
    socket.leave(roomId)
    socketToRoom.delete(socket.id)

    if (user) {
      socket.to(roomId).emit('user-left', {
        username: user.username,
        color: user.color,
        socketId: socket.id,
      })
      socket.to(roomId).emit('cursor-leave', {
        socketId: socket.id,
        username: user.username,
      })
    }

    // Clean up empty rooms (also clear any pending throttle timer)
    if (room.users.size === 0) {
      if (room.throttleTimer) {
        clearTimeout(room.throttleTimer)
        room.throttleTimer = null
      }
      rooms.delete(roomId)
    }
  }

  // ---------- HTTP server (with /health) ----------

  const THROTTLE_MS = 50

  const httpServer = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const url = req.url ?? ''

      if (req.method === 'GET' && url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            status: 'ok',
            rooms: rooms.size,
            // Legacy field (#275): sockets that have JOINED a room — same
            // semantics this endpoint always reported, kept for
            // backward compatibility.
            connections: socketToRoom.size,
            // New in #275 (additive fields only): ALL connected sockets,
            // whether or not they joined a room…
            connected: io.engine.clientsCount,
            // …and the joined count under an explicit, non-legacy name
            // (same value as `connections`).
            joined: socketToRoom.size,
          }),
        )
        return
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'not found' }))
    },
  )

  // ---------- Socket.io server ----------

  // NOTE on `path`:
  // The default socket.io path is `/socket.io/`. We intentionally DO NOT
  // override it to `/` here, because doing so makes engine.io match EVERY
  // URL (since every URL starts with `/`) and intercept our `/health`
  // HTTP endpoint. The Caddy gateway routes by the `XTransformPort` query
  // param, not by path, so any socket.io path works through the gateway.
  // Frontend connects with: io('/?XTransformPort=3003') — the default
  // path `/socket.io/` is appended automatically by socket.io-client.

  /**
   * Origin policy (#275). Exact-match allowlist resolved from
   * LIVE_ALLOWED_ORIGINS (default: the dev origins). A request WITHOUT an
   * Origin header is allowed — non-browser clients (curl, node clients,
   * CLI tooling) never send one and cannot be CSRF'd; browsers always
   * attach Origin, so a browser origin must be on the list.
   */
  const originAllowed = (origin: string | undefined): boolean =>
    !origin || allowedOrigins.includes(origin)

  const io = new Server(httpServer, {
    cors: {
      // Header-level allowlist for browser polling requests: only
      // allowlisted origins get Access-Control-Allow-Origin.
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
    // Transport-independent gate (enforced on polling AND websocket
    // handshakes — the `cors` option alone never covers websockets).
    allowRequest: (req, callback) => {
      const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined
      if (originAllowed(origin)) {
        callback(null, true)
        return
      }
      log.warn('handshake rejected — origin not allowed', { origin })
      callback('origin not allowed', false)
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Per-IP connection cap (#275) — enforced in middleware so an over-cap
  // handshake never reaches the connection handler. The client sees a
  // `connect_error` ("connection limit reached …").
  io.use((socket, next) => {
    const ip = socket.handshake.address ?? 'unknown'
    let set = connectionsByIp.get(ip)
    if (!set) {
      set = new Set()
      connectionsByIp.set(ip, set)
    }
    if (set.size >= limits.maxConnectionsPerIp) {
      log.warn('connection rejected — per-IP limit', {
        ip,
        limit: limits.maxConnectionsPerIp,
      })
      next(new Error(`connection limit reached for your IP (max ${limits.maxConnectionsPerIp})`))
      return
    }
    set.add(socket.id)
    next()
  })

  io.on('connection', (socket: Socket) => {
    const ip = socket.handshake.address ?? 'unknown'
    log.info('connect', { socketId: socket.id, ip })

    socket.on('disconnect', () => {
      const set = connectionsByIp.get(ip)
      if (set) {
        set.delete(socket.id)
        if (set.size === 0) connectionsByIp.delete(ip)
      }
    })

    // ---- join-room ----
    socket.on('join-room', (raw: unknown) => {
      try {
        const payload = (raw ?? {}) as JoinRoomPayload
        const roomId = typeof payload.roomId === 'string' ? payload.roomId.trim() : ''
        const username = typeof payload.username === 'string' ? payload.username.trim() : ''

        if (!roomId || !username) {
          socket.emit('error-msg', {
            event: 'join-room',
            message: 'roomId and username are required',
          })
          return
        }

        // Per-socket room cap (#275) — defensive bound; see the constant's
        // doc comment. socket.rooms always contains the socket's own id,
        // hence the -1.
        const joinedRooms = socket.rooms.size - 1
        if (joinedRooms >= limits.maxRoomsPerSocket) {
          log.warn('join-room rejected — per-socket room limit', {
            socketId: socket.id,
            roomId,
            limit: limits.maxRoomsPerSocket,
          })
          socket.emit('error-msg', {
            event: 'join-room',
            message: `room limit reached (max ${limits.maxRoomsPerSocket} per connection)`,
          })
          return
        }

        // Leave any previous room first
        const prevRoomId = socketToRoom.get(socket.id)
        if (prevRoomId && prevRoomId !== roomId) {
          leaveRoom(socket, prevRoomId)
        }

        const room = getOrCreateRoom(roomId)
        const color = pickColor()
        const user: RoomUser = { socketId: socket.id, username, color }

        room.users.set(socket.id, user)
        socketToRoom.set(socket.id, roomId)

        socket.join(roomId)

        // Send current room state back to the joining socket
        socket.emit('room-state', {
          roomId,
          code: room.code,
          users: publicUsers(room),
          cursors: publicCursors(room),
          chatHistory: room.chatHistory,
        })

        // Broadcast to everyone else in the room
        socket.to(roomId).emit('user-joined', {
          username,
          color,
          socketId: socket.id,
        })

        log.info('join-room', {
          socketId: socket.id,
          roomId,
          username,
          active: room.users.size,
        })
      } catch (err) {
        log.error('join-room error', { err: err instanceof Error ? err.message : String(err) })
        socket.emit('error-msg', { event: 'join-room', message: 'internal error' })
      }
    })

    // ---- leave-room ----
    socket.on('leave-room', (raw: unknown) => {
      try {
        const payload = (raw ?? {}) as { roomId?: string }
        const roomId = typeof payload.roomId === 'string' ? payload.roomId.trim() : ''
        if (!roomId) return
        leaveRoom(socket, roomId)
        log.info('leave-room', { socketId: socket.id, roomId })
      } catch (err) {
        log.error('leave-room error', { err: err instanceof Error ? err.message : String(err) })
      }
    })

    // ---- code-change (throttled, max 1 broadcast per 50ms per room) ----
    socket.on('code-change', (raw: unknown) => {
      try {
        const payload = (raw ?? {}) as CodeChangePayload
        const roomId = typeof payload.roomId === 'string' ? payload.roomId.trim() : ''
        if (!roomId) return

        // Payload size cap (#275) — reject BEFORE any store, stash, or
        // re-broadcast. Oversize payloads are answered with an `error-msg`
        // event; the room state is untouched.
        const code = typeof payload.code === 'string' ? payload.code : ''
        if (code.length > limits.codeMaxLength) {
          log.warn('code-change rejected — payload over cap', {
            socketId: socket.id,
            roomId,
            length: code.length,
            limit: limits.codeMaxLength,
          })
          socket.emit('error-msg', {
            event: 'code-change',
            message: `code too large (max ${limits.codeMaxLength} characters)`,
          })
          return
        }

        const room = rooms.get(roomId)
        if (!room) return

        const cursor =
          payload.cursor && typeof payload.cursor === 'object'
            ? (payload.cursor as CursorPayload)
            : null

        // Always update stored code so newly-joining users see the latest
        room.code = code

        const now = Date.now()
        const elapsed = now - room.lastCodeBroadcastTs

        if (elapsed >= THROTTLE_MS) {
          // Broadcast immediately
          room.lastCodeBroadcastTs = now
          room.pendingCode = null
          socket.to(roomId).emit('code-updated', {
            code,
            cursor,
            socketId: socket.id,
          })
        } else {
          // Stash latest payload and schedule a single flush at end of window
          room.pendingCode = { code, cursor }
          if (!room.throttleTimer) {
            const wait = THROTTLE_MS - elapsed
            room.throttleTimer = setTimeout(() => {
              const r = room
              const pending = r.pendingCode
              r.throttleTimer = null
              r.pendingCode = null
              if (!pending) return
              r.lastCodeBroadcastTs = Date.now()
              // Use io.to().except() so the originating socket still does not
              // receive its own echo even after the timer fires
              io.to(roomId).except(socket.id).emit('code-updated', {
                code: pending.code,
                cursor: pending.cursor,
                socketId: socket.id,
              })
            }, wait)
          }
        }
      } catch (err) {
        log.error('code-change error', { err: err instanceof Error ? err.message : String(err) })
      }
    })

    // ---- cursor-move ----
    socket.on('cursor-move', (raw: unknown) => {
      try {
        const payload = (raw ?? {}) as CursorMovePayload
        const roomId = typeof payload.roomId === 'string' ? payload.roomId.trim() : ''
        const username = typeof payload.username === 'string' ? payload.username.trim() : ''
        if (!roomId || !username) return

        const room = rooms.get(roomId)
        if (!room) return

        const fallbackColor = room.users.get(socket.id)?.color ?? '#888888'
        const cursor: StoredCursor = {
          socketId: socket.id,
          username,
          line: Number(payload.line) || 0,
          ch: Number(payload.ch) || 0,
          color: typeof payload.color === 'string' && payload.color ? payload.color : fallbackColor,
        }
        room.cursors.set(socket.id, cursor)

        socket.to(roomId).emit('cursor-moved', cursor)
      } catch (err) {
        log.error('cursor-move error', { err: err instanceof Error ? err.message : String(err) })
      }
    })

    // ---- chat-message (50-msg ring buffer, broadcast to all) ----
    socket.on('chat-message', (raw: unknown) => {
      try {
        const payload = (raw ?? {}) as ChatMessagePayload
        const roomId = typeof payload.roomId === 'string' ? payload.roomId.trim() : ''
        const username = typeof payload.username === 'string' ? payload.username.trim() : ''
        const rawMessage = typeof payload.message === 'string' ? payload.message : ''
        if (!roomId || !username || !rawMessage.trim()) return

        const room = rooms.get(roomId)
        if (!room) return

        const msg: ChatMessage = {
          username,
          message: rawMessage.slice(0, MESSAGE_MAX_LENGTH),
          timestamp:
            typeof payload.timestamp === 'number' && payload.timestamp > 0
              ? payload.timestamp
              : Date.now(),
        }

        // Push to ring buffer
        room.chatHistory.push(msg)
        if (room.chatHistory.length > CHAT_HISTORY_LIMIT) {
          room.chatHistory.shift()
        }

        // Broadcast to EVERYONE in the room (including sender for confirmation)
        io.to(roomId).emit('chat-received', msg)
      } catch (err) {
        log.error('chat-message error', { err: err instanceof Error ? err.message : String(err) })
      }
    })

    // ---- user-list (request current users in a room) ----
    socket.on('user-list', (raw: unknown) => {
      try {
        const payload = (raw ?? {}) as { roomId?: string }
        const roomId = typeof payload.roomId === 'string' ? payload.roomId.trim() : ''
        const room = roomId ? rooms.get(roomId) : undefined
        socket.emit('user-list-response', {
          roomId,
          users: room ? publicUsers(room) : [],
        })
      } catch (err) {
        log.error('user-list error', { err: err instanceof Error ? err.message : String(err) })
      }
    })

    // ---- disconnect ----
    socket.on('disconnect', (reason: string) => {
      try {
        const roomId = socketToRoom.get(socket.id)
        if (roomId) {
          leaveRoom(socket, roomId)
        }
        log.info('disconnect', { socketId: socket.id, reason })
      } catch (err) {
        log.error('disconnect error', { err: err instanceof Error ? err.message : String(err) })
      }
    })

    // ---- generic socket error (do not crash) ----
    socket.on('error', (err: Error) => {
      log.error('socket-error', { socketId: socket.id, err: err?.message ?? String(err) })
    })
  })

  return {
    httpServer,
    io,
    rooms,
    socketToRoom,
    connectionsByIp,
    limits,
    allowedOrigins,
    async close(): Promise<void> {
      io.close()
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve())
      })
    },
  }
}
