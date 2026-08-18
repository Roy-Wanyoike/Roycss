import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { Server, Socket } from 'socket.io'

// Hardcoded port per spec (NOT from env)
const PORT = 3003
const THROTTLE_MS = 50
const CHAT_HISTORY_LIMIT = 50
const MESSAGE_MAX_LENGTH = 4000

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

// ---------- In-memory state ----------

const rooms = new Map<string, RoomState>()
const socketToRoom = new Map<string, string>()

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

const httpServer = createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? ''

    if (req.method === 'GET' && url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'ok',
          rooms: rooms.size,
          connections: socketToRoom.size,
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
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

io.on('connection', (socket: Socket) => {
  console.log(`[connect] ${socket.id}`)

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

      console.log(`[join-room] ${username} (${color}) joined ${roomId} — ${room.users.size} active`)
    } catch (err) {
      console.error('[join-room] error:', err)
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
      console.log(`[leave-room] ${socket.id} left ${roomId}`)
    } catch (err) {
      console.error('[leave-room] error:', err)
    }
  })

  // ---- code-change (throttled, max 1 broadcast per 50ms per room) ----
  socket.on('code-change', (raw: unknown) => {
    try {
      const payload = (raw ?? {}) as CodeChangePayload
      const roomId = typeof payload.roomId === 'string' ? payload.roomId.trim() : ''
      if (!roomId) return

      const room = rooms.get(roomId)
      if (!room) return

      const code = typeof payload.code === 'string' ? payload.code : ''
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
      console.error('[code-change] error:', err)
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
      console.error('[cursor-move] error:', err)
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
      console.error('[chat-message] error:', err)
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
      console.error('[user-list] error:', err)
    }
  })

  // ---- disconnect ----
  socket.on('disconnect', (reason: string) => {
    try {
      const roomId = socketToRoom.get(socket.id)
      if (roomId) {
        leaveRoom(socket, roomId)
      }
      console.log(`[disconnect] ${socket.id} (${reason})`)
    } catch (err) {
      console.error('[disconnect] error:', err)
    }
  })

  // ---- generic socket error (do not crash) ----
  socket.on('error', (err: Error) => {
    console.error(`[socket-error] ${socket.id}:`, err?.message ?? err)
  })
})

// ---------- Startup ----------

httpServer.listen(PORT, () => {
  console.log(`Roy Live WebSocket service running on port ${PORT}`)
})

// ---------- Graceful shutdown ----------

function shutdown(signal: string): void {
  console.log(`[shutdown] ${signal} received, closing server...`)
  io.close(() => {
    httpServer.close(() => {
      console.log('[shutdown] server closed')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Catch-all to never crash on unhandled errors
process.on('uncaughtException', (err: Error) => {
  console.error('[uncaughtException]', err?.message ?? err)
})
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[unhandledRejection]', reason)
})
