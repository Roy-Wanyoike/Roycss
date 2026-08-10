"use client";

/**
 * RoyLive — real-time collaborative CSS editor (frontend for the
 * `live-service` WebSocket mini-service on port 3003).
 *
 * Multiple browser tabs join a room by ID, edit HTML + CSS together in
 * real time, see each other's cursors, and chat. All state lives in the
 * live-service process memory; nothing is persisted.
 *
 * Connection (CRITICAL — gateway rule):
 *   io("/?XTransformPort=3003")  ← routed by the Caddy gateway.
 *   NEVER io("http://localhost:3003") — that bypasses the gateway.
 *
 * Layout (3-column on lg+, stacked on mobile — editor first):
 *   • Left  — Join form (disconnected) or Room info (connected).
 *   • Center— HTML textarea, CSS textarea (with remote cursor flags),
 *             and a live <iframe> preview (srcDoc = HTML + <style>CSS</style>).
 *   • Right — Active users list + Chat (loads 50-msg ring buffer on join).
 *
 * Design notes:
 *   • "use client" — socket.io-client is browser-only.
 *   • Throttle: code-change emits max 1 per 100ms; cursor-move max 1 per
 *     50ms. Implemented with a Date.now() check + a trailing-edge
 *     setTimeout flush so the final keystroke always lands.
 *   • isRemoteUpdateRef guards against echo loops (defensive — the backend
 *     uses socket.to() so it never echoes back to the sender, but the ref
 *     is kept for safety and future-proofing).
 *   • Cleanup: socket.off for every listener + socket.disconnect on
 *     unmount; beforeunload emits leave-room.
 *   • Auto-prefill room ID from ?room=XXX; prefill username from
 *     localStorage so the user doesn't have to re-type on reload.
 *   • The `code` field is JSON-serialized `{html, css}` because the
 *     backend stores `code` as an opaque string. The first joiner pushes
 *     the local defaults to the server so late joiners see something.
 *   • TS strict, zero `any`, zero `console.log`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Code2,
  Copy,
  Hash,
  LogOut,
  MessageSquare,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Users,
  Wand2,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

interface RoomUser {
  socketId: string;
  username: string;
  color: string;
}

interface CursorInfo {
  socketId: string;
  username: string;
  line: number;
  ch: number;
  color: string;
}

interface ChatMessage {
  username: string;
  message: string;
  timestamp: number;
}

interface CodeState {
  html: string;
  css: string;
}

interface RoomStatePayload {
  roomId: string;
  code: string;
  users: RoomUser[];
  cursors: CursorInfo[];
  chatHistory: ChatMessage[];
}

interface CodeUpdatedPayload {
  code: string;
  cursor: CursorInfo | null;
  socketId: string;
}

interface ErrorMsgPayload {
  event: string;
  message: string;
}

interface UserLeftPayload {
  username: string;
  color: string;
  socketId: string;
}

interface CursorLeavePayload {
  socketId: string;
  username: string;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected";

// ─── Constants ────────────────────────────────────────────────────────────

/** 12-color palette — matches the live-service backend. */
const CURSOR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#8b5cf6", "#ec4899", "#84cc16", "#14b8a6", "#a855f7",
  "#f43f5e", "#0ea5e9",
] as const;

const DEFAULT_HTML = `<div class="hero">
  <h1>Hello, Roy Live 👋</h1>
  <p>Edit this CSS together, in real time.</p>
  <button>Get started</button>
</div>`;

const DEFAULT_CSS = `* { box-sizing: border-box; }
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 2rem;
  background: radial-gradient(circle at 30% 20%, #1e293b, #0f172a);
  color: #e2e8f0;
  min-height: 100vh;
}
.hero {
  max-width: 520px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #10b981, #14b8a6);
  color: white;
  box-shadow: 0 20px 60px -10px rgba(16, 185, 129, 0.4);
}
.hero h1 { margin: 0 0 .5rem; font-size: 2rem; }
.hero p  { margin: 0 0 1.25rem; opacity: .9; }
button {
  padding: .6rem 1.1rem;
  border: 0;
  border-radius: 10px;
  background: white;
  color: #0f172a;
  font-weight: 600;
  cursor: pointer;
  transition: transform .15s ease;
}
button:hover { transform: translateY(-2px); }`;

/**
 * Textarea geometry — MUST match the className on the actual <textarea>.
 * 13px monospace ≈ 7.8px advance per char; leading-5 = 20px line height.
 * px-3 = 12px horizontal padding; py-2 = 8px vertical padding.
 */
const CHAR_WIDTH = 7.8;
const LINE_HEIGHT = 20;
const TEXTAREA_PAD_X = 12;
const TEXTAREA_PAD_Y = 8;

const CODE_THROTTLE_MS = 100;
const CURSOR_THROTTLE_MS = 50;

const LS_USERNAME_KEY = "roylive-username";

// ─── Helpers ──────────────────────────────────────────────────────────────

function randomRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function randomColor(): string {
  const idx = Math.floor(Math.random() * CURSOR_COLORS.length);
  return CURSOR_COLORS[idx] ?? "#8b5cf6";
}

function serializeCode(code: CodeState): string {
  return JSON.stringify(code);
}

function deserializeCode(raw: string): CodeState {
  if (!raw) return { html: DEFAULT_HTML, css: DEFAULT_CSS };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "html" in parsed &&
      "css" in parsed &&
      typeof (parsed as Record<string, unknown>).html === "string" &&
      typeof (parsed as Record<string, unknown>).css === "string"
    ) {
      const obj = parsed as CodeState;
      return { html: obj.html, css: obj.css };
    }
  } catch {
    // fall through to legacy handling
  }
  // Legacy: treat raw string as CSS only (in case an older client stored plain CSS).
  return { html: DEFAULT_HTML, css: raw };
}

function buildSrcDoc(html: string, css: string): string {
  return (
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
    `<style>${css}</style></head><body>${html}</body></html>`
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getCursorPos(text: string, selStart: number): { line: number; ch: number } {
  const before = text.slice(0, selStart);
  const lines = before.split("\n");
  return {
    line: lines.length - 1,
    ch: (lines[lines.length - 1] ?? "").length,
  };
}

/** Very small CSS pretty-printer: trims trailing whitespace, re-indents by brace depth. */
function formatCss(input: string): string {
  const lines = input.split("\n").map((l) => l.trim());
  const out: string[] = [];
  let depth = 0;
  for (const line of lines) {
    if (!line) {
      out.push("");
      continue;
    }
    // If the line starts with '}', dedent before printing.
    if (line.startsWith("}")) {
      depth = Math.max(0, depth - 1);
    }
    out.push(`${"  ".repeat(depth)}${line}`);
    // Count brace balance changes on this line (after printing).
    for (const ch of line) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth = Math.max(0, depth - 1);
    }
  }
  return out.join("\n");
}

function buildShareLink(roomId: string): string {
  if (typeof window === "undefined") return `?room=${roomId}`;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?room=${roomId}`;
}

/** Read the saved username from localStorage (empty string if unavailable). */
function readSavedUsername(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(LS_USERNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Read the `?room=…` query param from the current URL (empty string if absent). */
function readUrlRoom(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("room") ?? "";
}

// ─── Component ────────────────────────────────────────────────────────────

/** Connection status pill — top-level so it doesn't get re-created on each render. */
function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  if (status === "connected") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 gap-1.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Connected
      </Badge>
    );
  }
  if (status === "connecting") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 gap-1.5">
        <Wifi className="size-3 animate-pulse" />
        Connecting…
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1.5">
      <WifiOff className="size-3" />
      Disconnected
    </Badge>
  );
}

export function RoyLive() {
  const { toast } = useToast();

  // Connection + identity
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [joined, setJoined] = useState(false);
  // Lazy-init from URL ?room=… and localStorage so we don't need a
  // setState-in-effect pass on mount (this component is lazy-loaded so
  // `window` is always defined when the initializer runs).
  const [username, setUsername] = useState<string>(() => readSavedUsername());
  const [roomId, setRoomId] = useState<string>(() => readUrlRoom());
  const [color, setColor] = useState<string>(randomColor);
  // `joinedRoomId` + `mySocketId` are state (not refs) because they're read
  // during render. The ref twins are used inside socket callbacks / timers.
  const [joinedRoomId, setJoinedRoomId] = useState("");
  const [mySocketId, setMySocketId] = useState("");

  // Editor + presence + chat
  const [code, setCode] = useState<CodeState>({ html: DEFAULT_HTML, css: DEFAULT_CSS });
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  // UI feedback
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const lastCodeEmitRef = useRef(0);
  const lastCursorEmitRef = useRef(0);
  const pendingCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCodeRef = useRef<CodeState | null>(null);
  const cssTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cursorLayerRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const joinedRoomRef = useRef<string>("");
  const usernameRef = useRef<string>("");
  const colorRef = useRef<string>("");

  // Keep refs in sync with state (used inside socket callbacks + timers
  // so they always read the latest values without re-binding listeners).
  useEffect(() => { usernameRef.current = username; }, [username]);
  useEffect(() => { colorRef.current = color; }, [color]);

  // ─── Auto-scroll chat to bottom on new message ─────────────────────────
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat]);

  // ─── Compute CSS-textarea cursor (for code-change cursor field) ────────
  const computeCursorFromTextarea = useCallback((): {
    line: number;
    ch: number;
  } | null => {
    const ta = cssTextareaRef.current;
    if (!ta) return null;
    return getCursorPos(ta.value, ta.selectionStart);
  }, []);

  // ─── Throttled code-change emit (max 1 per 100ms + trailing flush) ─────
  const emitCodeChange = useCallback((next: CodeState) => {
    const doEmit = (codeToEmit: CodeState) => {
      const socket = socketRef.current;
      const rid = joinedRoomRef.current;
      if (!socket || !rid || !socket.connected) return;
      lastCodeEmitRef.current = Date.now();
      const cur = computeCursorFromTextarea();
      socket.emit("code-change", {
        roomId: rid,
        code: serializeCode(codeToEmit),
        cursor: cur
          ? {
              username: usernameRef.current,
              line: cur.line,
              ch: cur.ch,
              color: colorRef.current,
            }
          : null,
      });
    };

    const now = Date.now();
    const elapsed = now - lastCodeEmitRef.current;

    if (elapsed >= CODE_THROTTLE_MS) {
      doEmit(next);
    } else {
      // Stash the latest code; schedule a single trailing flush.
      pendingCodeRef.current = next;
      if (!pendingCodeTimerRef.current) {
        const wait = CODE_THROTTLE_MS - elapsed;
        pendingCodeTimerRef.current = setTimeout(() => {
          pendingCodeTimerRef.current = null;
          const pending = pendingCodeRef.current;
          pendingCodeRef.current = null;
          if (pending) doEmit(pending);
        }, wait);
      }
    }
  }, [computeCursorFromTextarea]);

  // ─── Throttled cursor-move emit (max 1 per 50ms) ───────────────────────
  const emitCursorMove = useCallback(() => {
    const socket = socketRef.current;
    const rid = joinedRoomRef.current;
    if (!socket || !rid || !socket.connected) return;

    const now = Date.now();
    if (now - lastCursorEmitRef.current < CURSOR_THROTTLE_MS) return;
    lastCursorEmitRef.current = now;

    const cur = computeCursorFromTextarea();
    if (!cur) return;

    socket.emit("cursor-move", {
      roomId: rid,
      username: usernameRef.current,
      line: cur.line,
      ch: cur.ch,
      color: colorRef.current,
    });
  }, [computeCursorFromTextarea]);

  // ─── Socket lifecycle ───────────────────────────────────────────────────
  const connect = useCallback((rid: string, name: string, col: string) => {
    // Tear down any existing socket first.
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setStatus("connecting");

    // CRITICAL: route through the Caddy gateway via XTransformPort.
    // Path is "/" — Caddy forwards to port 3003 by the query param.
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      setMySocketId(socket.id ?? "");
      socket.emit("join-room", { roomId: rid, username: name, color: col });
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
      setMySocketId("");
    });

    socket.on("connect_error", () => {
      setStatus("disconnected");
      setMySocketId("");
    });

    socket.io.on("reconnect", () => {
      // Auto re-join on reconnect (the server may have forgotten us).
      const r = joinedRoomRef.current;
      const u = usernameRef.current;
      const c = colorRef.current;
      if (r && u) {
        socket.emit("join-room", { roomId: r, username: u, color: c });
      }
    });

    // Room state — sent to us on join (initial snapshot).
    socket.on("room-state", (payload: RoomStatePayload) => {
      const parsed = deserializeCode(payload.code);
      isRemoteUpdateRef.current = true;
      setCode(parsed);
      isRemoteUpdateRef.current = false;

      setUsers(payload.users ?? []);
      const cursorsMap: Record<string, CursorInfo> = {};
      for (const c of payload.cursors ?? []) {
        cursorsMap[c.socketId] = c;
      }
      setCursors(cursorsMap);
      setChat(payload.chatHistory ?? []);
      setJoined(true);

      // First joiner pushes the local defaults to the server so
      // late joiners see something other than an empty editor.
      if (!payload.code) {
        socket.emit("code-change", {
          roomId: rid,
          code: serializeCode(parsed),
          cursor: null,
        });
      }

      toast({
        title: "Joined room",
        description: `${payload.users?.length ?? 0} user(s) online.`,
      });
    });

    // Other user joined (broadcast to everyone else).
    socket.on("user-joined", (u: RoomUser) => {
      setUsers((prev) => {
        if (prev.some((x) => x.socketId === u.socketId)) return prev;
        return [...prev, u];
      });
      toast({
        title: `${u.username} joined`,
        description: "Say hi in the chat!",
      });
    });

    // Other user left.
    socket.on("user-left", (u: UserLeftPayload) => {
      setUsers((prev) => prev.filter((x) => x.socketId !== u.socketId));
      setCursors((prev) => {
        const next = { ...prev };
        delete next[u.socketId];
        return next;
      });
      toast({ title: `${u.username} left` });
    });

    // Remote code change (broadcast to others — never the sender).
    socket.on("code-updated", (p: CodeUpdatedPayload) => {
      const parsed = deserializeCode(p.code);
      isRemoteUpdateRef.current = true;
      setCode(parsed);
      // Reset the guard after React flushes the re-render.
      queueMicrotask(() => {
        isRemoteUpdateRef.current = false;
      });
      if (p.cursor) {
        // Extract to a typed local so TS keeps the narrowing inside the
        // setState callback (otherwise p.cursor is widened back to
        // CursorInfo | null and the spread produces optional fields).
        const remoteCursor: CursorInfo = {
          socketId: p.socketId,
          username: p.cursor.username,
          line: p.cursor.line,
          ch: p.cursor.ch,
          color: p.cursor.color,
        };
        setCursors((prev) => ({
          ...prev,
          [p.socketId]: remoteCursor,
        }));
      }
    });

    // Remote cursor moved.
    socket.on("cursor-moved", (c: CursorInfo) => {
      setCursors((prev) => ({
        ...prev,
        [c.socketId]: c,
      }));
    });

    // Remote cursor left (user disconnected / left the room).
    socket.on("cursor-leave", (p: CursorLeavePayload) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[p.socketId];
        return next;
      });
    });

    // Chat message received (broadcast to ALL in room, incl. sender).
    socket.on("chat-received", (m: ChatMessage) => {
      setChat((prev) => [...prev, m]);
    });

    // Server-side error.
    socket.on("error-msg", (e: ErrorMsgPayload) => {
      toast({
        title: `Error: ${e.event}`,
        description: e.message,
        variant: "destructive",
      });
    });
  }, [toast]);

  // ─── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      if (socket) {
        const rid = joinedRoomRef.current;
        if (rid && socket.connected) {
          socket.emit("leave-room", { roomId: rid });
        }
        socket.removeAllListeners();
        socket.disconnect();
        socketRef.current = null;
      }
      if (pendingCodeTimerRef.current) {
        clearTimeout(pendingCodeTimerRef.current);
        pendingCodeTimerRef.current = null;
      }
    };
  }, []);

  // ─── beforeunload handler ──────────────────────────────────────────────
  useEffect(() => {
    function onBeforeUnload() {
      const socket = socketRef.current;
      const rid = joinedRoomRef.current;
      if (socket && rid && socket.connected) {
        socket.emit("leave-room", { roomId: rid });
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // ─── Actions ───────────────────────────────────────────────────────────
  const handleJoin = useCallback(() => {
    const rid = roomId.trim();
    const name = username.trim();
    if (!rid) {
      toast({ title: "Room ID required", variant: "destructive" });
      return;
    }
    if (!name) {
      toast({ title: "Username required", variant: "destructive" });
      return;
    }
    try {
      window.localStorage.setItem(LS_USERNAME_KEY, name);
    } catch {
      // ignore storage failure
    }
    joinedRoomRef.current = rid;
    setJoinedRoomId(rid);
    connect(rid, name, color);
  }, [roomId, username, color, connect, toast]);

  const handleLeave = useCallback(() => {
    const socket = socketRef.current;
    const rid = joinedRoomRef.current;
    if (socket && rid && socket.connected) {
      socket.emit("leave-room", { roomId: rid });
    }
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    }
    joinedRoomRef.current = "";
    setJoinedRoomId("");
    setMySocketId("");
    setJoined(false);
    setStatus("disconnected");
    setUsers([]);
    setCursors({});
    setChat([]);
    setCode({ html: DEFAULT_HTML, css: DEFAULT_CSS });
    if (pendingCodeTimerRef.current) {
      clearTimeout(pendingCodeTimerRef.current);
      pendingCodeTimerRef.current = null;
    }
    toast({ title: "Left room" });
  }, [toast]);

  const handleGenerateRoom = useCallback(() => {
    setRoomId(randomRoomId());
  }, []);

  const handleCopyRoom = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinedRoomRef.current);
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }, [toast]);

  const handleShareLink = useCallback(async () => {
    const link = buildShareLink(joinedRoomRef.current);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({ title: "Share link copied", description: link });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }, [toast]);

  const handleHtmlChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    if (isRemoteUpdateRef.current) return;
    const next = { ...code, html: e.target.value };
    setCode(next);
    emitCodeChange(next);
  }, [code, emitCodeChange]);

  const handleCssChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    if (isRemoteUpdateRef.current) return;
    const next = { ...code, css: e.target.value };
    setCode(next);
    emitCodeChange(next);
  }, [code, emitCodeChange]);

  const handleCssInteract = useCallback(() => {
    emitCursorMove();
  }, [emitCursorMove]);

  // Sync the cursor-flag overlay layer when the CSS textarea scrolls.
  const handleCssScroll = useCallback((e: UIEvent<HTMLTextAreaElement>) => {
    if (cursorLayerRef.current) {
      cursorLayerRef.current.style.transform =
        `translate(${-e.currentTarget.scrollLeft}px, ${-e.currentTarget.scrollTop}px)`;
    }
  }, []);

  const handleReset = useCallback(() => {
    const next = { html: DEFAULT_HTML, css: DEFAULT_CSS };
    setCode(next);
    emitCodeChange(next);
    toast({ title: "Editor reset to defaults" });
  }, [emitCodeChange, toast]);

  const handleFormat = useCallback(() => {
    const next = { ...code, css: formatCss(code.css) };
    setCode(next);
    emitCodeChange(next);
    toast({ title: "CSS formatted" });
  }, [code, emitCodeChange, toast]);

  const handleSendChat = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg) return;
    const socket = socketRef.current;
    const rid = joinedRoomRef.current;
    if (!socket || !rid || !socket.connected) return;
    socket.emit("chat-message", {
      roomId: rid,
      username: usernameRef.current,
      message: msg,
      timestamp: Date.now(),
    });
    setChatInput("");
  }, [chatInput]);

  const handleChatKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  }, [handleSendChat]);

  // ─── Derived ───────────────────────────────────────────────────────────
  const otherCursors = useMemo(() => Object.values(cursors), [cursors]);
  const charCount = useMemo(
    () => code.html.length + code.css.length,
    [code],
  );
  const srcDoc = useMemo(() => buildSrcDoc(code.html, code.css), [code]);
  const aloneInRoom = users.length <= 1;

  // ─── Join form (not joined yet) ────────────────────────────────────────
  if (!joined) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-xl">
                  <Code2 className="size-5" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Join a Roy Live room
                    <Badge variant="secondary" className="text-[10px]">beta</Badge>
                  </CardTitle>
                  <CardDescription>
                    Real-time collaborative CSS editor — cursors, chat, live preview.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </div>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="roylive-username">Username</Label>
              <Input
                id="roylive-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ada-lovelace"
                maxLength={24}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoin();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roylive-room">Room ID</Label>
              <div className="flex gap-2">
                <Input
                  id="roylive-room"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="e.g. AB12CD"
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoin();
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateRoom}
                  className="gap-1.5 shrink-0"
                  title="Generate a random room ID"
                >
                  <Sparkles className="size-4" />
                  <span className="hidden sm:inline">Random</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your cursor color</Label>
              <div className="flex flex-wrap gap-2">
                {CURSOR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Pick color ${c}`}
                    className={cn(
                      "size-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                      color === c ? "ring-foreground" : "ring-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Auto-assigned if you don&apos;t pick.
              </p>
            </div>

            <Separator />

            <Button
              onClick={handleJoin}
              disabled={status === "connecting"}
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              <Wifi className="size-4" />
              {status === "connecting" ? "Connecting…" : "Join Room"}
            </Button>

            <p className="text-muted-foreground text-center text-xs">
              Tip: open this page in two browser tabs to see live collaboration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main 3-column layout (joined) ─────────────────────────────────────
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
      {/* ─── Left column: Room info ────────────────────────────────────── */}
      <div className="order-3 lg:order-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="text-primary size-4" />
                Room
              </CardTitle>
              <ConnectionBadge status={status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Room ID</Label>
              <div className="flex items-center gap-2">
                <code className="bg-muted flex-1 truncate rounded-md px-2 py-1.5 font-mono text-sm">
                  {joinedRoomId}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyRoom}
                  title="Copy room ID"
                  className="size-8 shrink-0"
                >
                  {copiedRoom ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleShareLink}
              className="w-full gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="size-4 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="size-4" />
                  Share room link
                </>
              )}
            </Button>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">You</Label>
              <div className="flex items-center gap-2">
                <div
                  className="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: color }}
                >
                  {(username.charAt(0) || "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{username}</p>
                  <p className="text-muted-foreground text-[11px] tabular-nums">
                    {charCount} chars typed
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <Button
              variant="destructive"
              onClick={handleLeave}
              className="w-full gap-2"
            >
              <LogOut className="size-4" />
              Leave room
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ─── Center column: Editor ─────────────────────────────────────── */}
      <div className="order-1 lg:order-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Code2 className="text-primary size-4" />
                Collaborative editor
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFormat}
                  className="gap-1.5 h-8"
                  title="Re-indent CSS"
                >
                  <Wand2 className="size-3.5" />
                  Format
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="gap-1.5 h-8"
                  title="Reset to defaults"
                >
                  <RefreshCw className="size-3.5" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* HTML textarea */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground flex items-center justify-between text-xs">
                <span>HTML</span>
                <span className="tabular-nums">{code.html.length} chars</span>
              </Label>
              <textarea
                value={code.html}
                onChange={handleHtmlChange}
                spellCheck={false}
                wrap="off"
                aria-label="HTML editor"
                className="border-input bg-background focus-visible:ring-ring h-32 w-full resize-y rounded-md border px-3 py-2 font-mono text-[13px] leading-5 outline-none focus-visible:ring-2"
              />
            </div>

            {/* CSS textarea with cursor overlay */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground flex items-center justify-between text-xs">
                <span>CSS</span>
                <span className="tabular-nums">{code.css.length} chars</span>
              </Label>
              <div className="relative">
                <textarea
                  ref={cssTextareaRef}
                  value={code.css}
                  onChange={handleCssChange}
                  onKeyUp={handleCssInteract}
                  onClick={handleCssInteract}
                  onSelect={handleCssInteract}
                  onScroll={handleCssScroll}
                  spellCheck={false}
                  wrap="off"
                  aria-label="CSS editor"
                  className="border-input bg-background focus-visible:ring-ring h-56 w-full resize-y rounded-md border px-3 py-2 font-mono text-[13px] leading-5 outline-none focus-visible:ring-2"
                />
                {/* Remote cursor overlay layer (transformed by scroll handler) */}
                <div
                  ref={cursorLayerRef}
                  className="pointer-events-none absolute inset-0 overflow-visible"
                  aria-hidden="true"
                >
                  <AnimatePresence>
                    {otherCursors.map((c) => (
                      <motion.div
                        key={c.socketId}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-10"
                        style={{
                          top: TEXTAREA_PAD_Y + c.line * LINE_HEIGHT,
                          left: TEXTAREA_PAD_X + c.ch * CHAR_WIDTH,
                          height: LINE_HEIGHT,
                        }}
                      >
                        {/* Name tag (above the cursor bar) */}
                        <div
                          className="absolute -top-4 left-0 whitespace-nowrap rounded px-1 py-0.5 text-[9px] font-semibold leading-none text-white shadow-sm"
                          style={{ backgroundColor: c.color }}
                        >
                          {c.username}
                        </div>
                        {/* Cursor bar */}
                        <div
                          className="w-0.5"
                          style={{
                            backgroundColor: c.color,
                            height: LINE_HEIGHT,
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Live preview iframe */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground flex items-center justify-between text-xs">
                <span>Live preview</span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Real-time
                </span>
              </Label>
              <iframe
                title="Live preview"
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-modals allow-forms allow-popups"
                className="border bg-white h-72 w-full rounded-lg border"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Right column: Presence + Chat ─────────────────────────────── */}
      <div className="order-2 lg:order-3">
        <Card className="flex h-full flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="text-primary size-4" />
              Active users
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {users.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
            {/* Users list */}
            <div className="space-y-2">
              {users.length === 0 && (
                <p className="text-muted-foreground text-xs">No users online.</p>
              )}
              {users.map((u) => {
                const isMe = u.socketId === mySocketId;
                return (
                  <div
                    key={u.socketId}
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: u.color }}
                    >
                      {(u.username.charAt(0) || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {u.username}
                        {isMe && (
                          <span className="text-muted-foreground ml-1 text-[10px] font-normal">
                            (you)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
              {aloneInRoom && users.length > 0 && (
                <p className="text-muted-foreground rounded-md border border-dashed p-2 text-center text-xs">
                  No one else here yet — share the room link!
                </p>
              )}
            </div>

            <Separator />

            {/* Chat header */}
            <div className="flex items-center gap-2">
              <MessageSquare className="text-primary size-4" />
              <span className="text-sm font-semibold">Chat</span>
            </div>

            {/* Message list (max-h-96 with custom scrollbar styling) */}
            <div
              ref={chatScrollRef}
              className="max-h-96 flex-1 space-y-2 overflow-y-auto pr-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgb(148 163 184 / 0.4) transparent",
              }}
            >
              {chat.length === 0 && (
                <p className="text-muted-foreground py-6 text-center text-xs">
                  No messages yet. Start the conversation!
                </p>
              )}
              <AnimatePresence initial={false}>
                {chat.map((m, i) => {
                  const isMine = m.username === username;
                  const sender = users.find((u) => u.username === m.username);
                  const senderColor = sender?.color ?? "#64748b";
                  return (
                    <motion.div
                      key={`${m.timestamp}-${i}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "flex flex-col gap-0.5",
                        isMine ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs",
                          isMine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        {!isMine && (
                          <p
                            className="mb-0.5 text-[10px] font-semibold"
                            style={{ color: senderColor }}
                          >
                            {m.username}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      </div>
                      <span className="text-muted-foreground px-1 text-[9px] tabular-nums">
                        {formatTime(m.timestamp)}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Message input */}
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKey}
                placeholder="Type a message…"
                maxLength={4000}
                aria-label="Chat message"
                className="h-9"
              />
              <Button
                size="icon"
                onClick={handleSendChat}
                disabled={!chatInput.trim()}
                className="size-9 shrink-0"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RoyLive;
