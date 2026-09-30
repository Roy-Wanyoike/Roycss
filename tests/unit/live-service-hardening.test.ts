import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { io, type Socket } from "socket.io-client";

import {
  CHAT_HISTORY_LIMIT,
  CODE_MAX_LENGTH,
  DEFAULT_ALLOWED_ORIGINS,
  MAX_CONNECTIONS_PER_IP,
  MAX_ROOMS_PER_SOCKET,
  MESSAGE_MAX_LENGTH,
  createLiveService,
  createLogger,
  parseAllowedOrigins,
  type LiveService,
} from "../../mini-services/live-service/server";

/**
 * live-service hardening suite (issue #275).
 *
 * mini-services/live-service had ZERO tests (tests-per-module convention
 * violation) and four hardening gaps: an unbounded `code` payload (socket.io
 * defaults to 1 MB per message), `origin: '*'` CORS, no per-IP connection /
 * per-socket room caps, console.log logging, and a `/health` that only
 * counted joined sockets.
 *
 * The service was split into `server.ts` (factory: createLiveService — no
 * listen, no process handlers) and `index.ts` (production bootstrap on the
 * hardcoded port 3003). That makes BEHAVIORAL tests possible: each suite
 * boots an isolated instance on an ephemeral port and drives it with the
 * real socket.io-client (root devDependency). Source pins guard the
 * constants and wiring that cannot be reached behaviorally (e.g. the
 * per-socket room cap is defensive while the client model is one-room-per-
 * socket).
 */

const ROOT = join(__dirname, "..", "..");
const SERVER_SRC = () => readFileSync(join(ROOT, "mini-services/live-service/server.ts"), "utf8");
const INDEX_SRC = () => readFileSync(join(ROOT, "mini-services/live-service/index.ts"), "utf8");

// ─── harness ───────────────────────────────────────────────────────────────

const sockets: Socket[] = [];
const services: LiveService[] = [];

afterEach(async () => {
  for (const s of sockets.splice(0)) s.close();
  for (const svc of services.splice(0)) await svc.close();
});

async function boot(opts: Parameters<typeof createLiveService>[0] = {}): Promise<{ svc: LiveService; port: number }> {
  const svc = createLiveService(opts);
  services.push(svc);
  await new Promise<void>((resolve) => svc.httpServer.listen(0, "127.0.0.1", resolve));
  const port = (svc.httpServer.address() as AddressInfo).port;
  return { svc, port };
}

/** Connect a socket.io-client; resolves on connect, rejects on connect_error. */
function connect(port: number, opts: Parameters<typeof io>[1] = {}): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}`, {
      transports: ["polling", "websocket"],
      timeout: 3000,
      // Isolated manager + no retries: each connect() is one deterministic
      // handshake attempt (io() would otherwise cache a Manager per URL and
      // silently reuse the first call's options).
      forceNew: true,
      reconnection: false,
      ...opts,
    });
    sockets.push(socket);
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (err: Error) => reject(err));
  });
}

/** Connect expecting the handshake to be REJECTED; resolves with the error. */
function expectConnectError(port: number, opts: Parameters<typeof io>[1] = {}): Promise<Error> {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}`, {
      transports: ["polling", "websocket"],
      timeout: 3000,
      forceNew: true,
      reconnection: false,
      ...opts,
    });
    sockets.push(socket);
    const fail = setTimeout(() => reject(new Error("expected a connect_error, got none")), 4000);
    socket.once("connect", () => {
      clearTimeout(fail);
      reject(new Error("expected the handshake to be rejected, but it connected"));
    });
    socket.once("connect_error", (err: Error) => {
      clearTimeout(fail);
      resolve(err);
    });
  });
}

function joinRoom(socket: Socket, roomId: string, username = "user"): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("room-state timeout")), 3000);
    socket.once("room-state", () => {
      clearTimeout(timer);
      resolve();
    });
    socket.emit("join-room", { roomId, username });
  });
}

/** Join and resolve with the room-state payload the server sends back. */
function roomState<T>(socket: Socket, roomId: string, username = "user"): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("room-state timeout")), 3000);
    socket.once("room-state", (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
    socket.emit("join-room", { roomId, username });
  });
}

async function health(port: number): Promise<Record<string, unknown>> {
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  expect(res.status).toBe(200);
  return (await res.json()) as Record<string, unknown>;
}

// ─── service shape: defaults are the documented constants (#275) ──────────

describe("createLiveService — documented defaults", () => {
  it("exposes the pinned hardening limits as its defaults", async () => {
    const { svc } = await boot();
    expect(svc.limits).toEqual({
      codeMaxLength: CODE_MAX_LENGTH,
      maxConnectionsPerIp: MAX_CONNECTIONS_PER_IP,
      maxRoomsPerSocket: MAX_ROOMS_PER_SOCKET,
    });
    expect(CODE_MAX_LENGTH).toBe(20_000);
    expect(MAX_CONNECTIONS_PER_IP).toBe(20);
    expect(MAX_ROOMS_PER_SOCKET).toBe(5);
    // Pre-existing caps unchanged.
    expect(MESSAGE_MAX_LENGTH).toBe(4000);
    expect(CHAT_HISTORY_LIMIT).toBe(50);
  });

  it("defaults the origin allowlist to the dev origins (sandbox flows keep working)", async () => {
    const { svc } = await boot();
    expect(svc.allowedOrigins).toEqual(DEFAULT_ALLOWED_ORIGINS);
    expect(DEFAULT_ALLOWED_ORIGINS).toContain("http://localhost:3000");
    expect(DEFAULT_ALLOWED_ORIGINS).toContain("http://localhost:3323");
  });
});

describe("parseAllowedOrigins — LIVE_ALLOWED_ORIGINS", () => {
  const ORIGINAL = process.env.LIVE_ALLOWED_ORIGINS;
  beforeEach(() => {
    delete process.env.LIVE_ALLOWED_ORIGINS;
  });
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.LIVE_ALLOWED_ORIGINS;
    else process.env.LIVE_ALLOWED_ORIGINS = ORIGINAL;
  });

  it("falls back to the dev origins when unset/empty/blank", () => {
    expect(parseAllowedOrigins({})).toEqual(DEFAULT_ALLOWED_ORIGINS);
    expect(parseAllowedOrigins({ LIVE_ALLOWED_ORIGINS: "" })).toEqual(DEFAULT_ALLOWED_ORIGINS);
    expect(parseAllowedOrigins({ LIVE_ALLOWED_ORIGINS: "   " })).toEqual(DEFAULT_ALLOWED_ORIGINS);
    expect(parseAllowedOrigins({ LIVE_ALLOWED_ORIGINS: " , , " })).toEqual(DEFAULT_ALLOWED_ORIGINS);
  });

  it("REPLACES the default with the comma-separated list (trimmed, exact match entries)", () => {
    expect(parseAllowedOrigins({ LIVE_ALLOWED_ORIGINS: "https://roycss.com" })).toEqual([
      "https://roycss.com",
    ]);
    expect(
      parseAllowedOrigins({ LIVE_ALLOWED_ORIGINS: " https://a.example , https://b.example ,," }),
    ).toEqual(["https://a.example", "https://b.example"]);
  });

  it("is wired from process.env in production (no wildcard anywhere)", () => {
    // Wiring pin: the module reads the env var by name, and the old
    // permissive CORS is gone from the source.
    expect(SERVER_SRC()).toContain("LIVE_ALLOWED_ORIGINS");
    expect(SERVER_SRC()).not.toContain("origin: '*'");
  });
});

// ─── behavioral: code payload cap ──────────────────────────────────────────

describe("code-change payload cap (20,000 chars)", () => {
  it("rejects an oversize payload with an error-msg event and stores/re-broadcasts NOTHING", async () => {
    const { svc, port } = await boot();
    const a = await connect(port);
    await joinRoom(a, "cap-room", "alice");

    const errors: unknown[] = [];
    a.on("error-msg", (payload: unknown) => errors.push(payload));

    // 1 char over the cap — must be rejected…
    a.emit("code-change", { roomId: "cap-room", code: "x".repeat(CODE_MAX_LENGTH + 1) });
    await vi.waitFor(
      () => {
        expect(errors).toHaveLength(1);
      },
      { timeout: 3000, interval: 25 },
    );
    expect(errors[0]).toMatchObject({ event: "code-change", message: expect.stringContaining("20000") });

    // …and the room state must be untouched: a late joiner sees empty code.
    const b = await connect(port);
    const state = await roomState<{ code: string }>(b, "cap-room", "bob");
    expect(state.code).toBe("");
    expect(svc.rooms.get("cap-room")?.code).toBe("");
  });

  it("accepts a payload of exactly the cap (boundary) and still syncs the room", async () => {
    const { port } = await boot();
    const a = await connect(port);
    await joinRoom(a, "edge-room", "alice");

    const errors: unknown[] = [];
    a.on("error-msg", (payload: unknown) => errors.push(payload));

    a.emit("code-change", { roomId: "edge-room", code: "y".repeat(CODE_MAX_LENGTH) });
    // No rejection within a grace window…
    await new Promise((r) => setTimeout(r, 200));
    expect(errors).toHaveLength(0);

    // …and the code really synced — a second joiner receives the stored code.
    const b = await connect(port);
    const state = await roomState<{ code: string }>(b, "edge-room", "bob");
    expect(state.code).toBe("y".repeat(CODE_MAX_LENGTH));
  });

  it("rejects BEFORE the room lookup / store / broadcast in the source (ordering pin)", () => {
    const src = SERVER_SRC();
    const capLog = src.indexOf("'code-change rejected — payload over cap'");
    const store = src.indexOf("room.code = code");
    const lookup = src.indexOf("const room = rooms.get(roomId)", capLog);
    expect(capLog).toBeGreaterThan(-1);
    expect(store).toBeGreaterThan(-1);
    expect(lookup).toBeGreaterThan(-1);
    expect(capLog, "cap must fire before the room lookup").toBeLessThan(lookup);
    expect(capLog, "cap must fire before the store/re-broadcast").toBeLessThan(store);
  });
});

// ─── behavioral: per-IP connection cap ─────────────────────────────────────

describe("per-IP connection cap", () => {
  it("rejects connections beyond the cap for the same remote address with connect_error", async () => {
    const { port } = await boot({ maxConnectionsPerIp: 2 });

    await connect(port);
    await connect(port);
    const err = await expectConnectError(port);
    expect(err.message).toMatch(/connection limit/i);
  });

  it("frees the slot on disconnect (closing one socket lets the next connect)", async () => {
    const { port } = await boot({ maxConnectionsPerIp: 2 });

    const first = await connect(port);
    await connect(port);
    await expectConnectError(port);

    first.close();
    sockets.splice(sockets.indexOf(first), 1);
    // The disconnect bookkeeping is async — poll until the freed slot works.
    await vi.waitFor(
      async () => {
        await connect(port);
      },
      { timeout: 4000, interval: 100 },
    );
  });

  it("tracks addresses in connectionsByIp and cleans up empty sets", async () => {
    const { svc, port } = await boot();
    const a = await connect(port);
    // The client dials 127.0.0.1 and the server listens on 127.0.0.1, so
    // socket.handshake.address — the per-IP map key — is exactly that.
    const ip = "127.0.0.1";
    await vi.waitFor(
      () => {
        expect(svc.connectionsByIp.get(ip)?.size).toBe(1);
      },
      { timeout: 3000, interval: 25 },
    );
    a.close();
    sockets.splice(sockets.indexOf(a), 1);
    await vi.waitFor(
      () => {
        expect(svc.connectionsByIp.has(ip)).toBe(false);
      },
      { timeout: 4000, interval: 50 },
    );
  });
});

// ─── behavioral: per-socket room cap (defensive bound) ─────────────────────

describe("per-socket room cap", () => {
  it("is pinned in the join-room source (defensive bound — the current client model is one room per socket)", () => {
    const src = SERVER_SRC();
    expect(src).toContain("joinedRooms >= limits.maxRoomsPerSocket");
    expect(src).toMatch(/room limit reached/);
  });
});

// ─── behavioral: CORS origin allowlist ─────────────────────────────────────

describe("CORS origin allowlist", () => {
  it("connects a client whose Origin is on the allowlist", async () => {
    const { port } = await boot({ allowedOrigins: ["http://localhost:3000"] });
    await connect(port, { extraHeaders: { origin: "http://localhost:3000" } });
  });

  it("connects a non-browser client that sends NO Origin header", async () => {
    const { port } = await boot({ allowedOrigins: ["http://localhost:3000"] });
    await connect(port);
  });

  it("rejects a cross-origin browser handshake (polling AND websocket paths)", async () => {
    const { port } = await boot({ allowedOrigins: ["http://localhost:3000"] });
    for (const transports of [["polling"], ["websocket"]] as const) {
      const err = await expectConnectError(port, {
        transports: [...transports],
        extraHeaders: { origin: "https://evil.example" },
      });
      // The handshake is REJECTED on both transports (expectConnectError
      // can only resolve via connect_error — a successful connect would
      // fail the helper). engine.io-client masks the underlying cause
      // ("xhr poll error" on polling; the ws status on upgrade), so the
      // assertion is on the denial itself; the REASON is pinned to
      // allowRequest in the source-pin suite below.
      expect(err).toBeInstanceOf(Error);
    }
  });
});

// ─── behavioral: /health metric semantics ──────────────────────────────────

describe("GET /health — connected vs joined counts", () => {
  it("counts BOTH connected sockets and joined sockets (additive, backward-compatible shape)", async () => {
    const { port } = await boot();

    // Shape pin BEFORE any sockets: the legacy fields are always present.
    const empty = await health(port);
    expect(empty).toMatchObject({ status: "ok", rooms: 0, connections: 0, connected: 0, joined: 0 });

    const a = await connect(port);
    await joinRoom(a, "health-room", "alice");
    const b = await connect(port); // connected but never joins

    await vi.waitFor(
      async () => {
        const h = await health(port);
        // connected: all sockets; connections/joined: only room-joiners —
        // the legacy `connections` semantics are unchanged.
        expect(h).toMatchObject({
          status: "ok",
          rooms: 1,
          connected: 2,
          connections: 1,
          joined: 1,
        });
      },
      { timeout: 3000, interval: 50 },
    );

    b.close();
    sockets.splice(sockets.indexOf(b), 1);
    await vi.waitFor(
      async () => {
        const h = await health(port);
        expect(h.connected).toBe(1);
        expect(h.joined).toBe(1);
      },
      { timeout: 4000, interval: 50 },
    );
  });
});

// ─── structured logger ─────────────────────────────────────────────────────

describe("structured logger", () => {
  it("emits one {ts,level,msg,scope,...} JSON line per call on stdout", () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    try {
      const log = createLogger("unit-test");
      log.info("hello world", { extra: 1 });
      log.warn("careful");
      log.error("boom", { code: 42 });

      const lines = write.mock.calls.map((c) => String(c[0])).filter((l) => l.trim().length > 0);
      expect(lines).toHaveLength(3);

      const first = JSON.parse(lines[0]!) as { ts: string; level: string; msg: string; scope: string; extra: number };
      expect(first).toMatchObject({ level: "info", msg: "hello world", scope: "unit-test", extra: 1 });
      expect(new Date(first.ts).getTime()).not.toBeNaN();

      expect(JSON.parse(lines[1]!)).toMatchObject({ level: "warn", msg: "careful" });
      expect(JSON.parse(lines[2]!)).toMatchObject({ level: "error", msg: "boom", code: 42 });
      // Newline-terminated JSON lines (one object per line).
      expect(lines.every((l) => l.endsWith("\n"))).toBe(true);
      expect(lines.every((l) => l.trimStart().startsWith("{"))).toBe(true);
    } finally {
      write.mockRestore();
    }
  });

  it("console.log/console.error are gone from the service source (logger-only)", () => {
    for (const [file, src] of [
      ["server.ts", SERVER_SRC()],
      ["index.ts", INDEX_SRC()],
    ] as const) {
      expect(src, `${file} must not use console.log`).not.toMatch(/\bconsole\.log\(/);
      expect(src, `${file} must not use console.error`).not.toMatch(/\bconsole\.error\(/);
      expect(src, `${file} must not use console.warn`).not.toMatch(/\bconsole\.warn\(/);
    }
  });
});

// ─── source pins: constants & wiring that behavior cannot reach ────────────

describe("source pins (#275 hardening wiring)", () => {
  it("server.ts pins the env-configurable allowlist and the transport-independent origin gate", () => {
    const src = SERVER_SRC();
    expect(src).toContain("allowRequest"); // enforced on polling AND websocket handshakes
    expect(src).toContain("originAllowed");
    expect(src).toContain("DEFAULT_ALLOWED_ORIGINS");
  });

  it("index.ts remains the thin bootstrap on the hardcoded port 3003 (spec: NOT from env)", () => {
    const src = INDEX_SRC();
    expect(src).toContain("const PORT = 3003");
    expect(src).toContain("createLiveService()");
    expect(src).not.toMatch(/process\.env/);
  });

  it("Caddyfile XTransformPort is allowlisted to 3000/3003/4100 — no dynamic upstream remains", () => {
    // Issue #275: the query param used to proxy to ANY localhost port
    // (`reverse_proxy localhost:{query.XTransformPort}`) — an SSRF pivot.
    // The upstream must never be derived from user input again.
    const caddy = readFileSync(join(ROOT, "Caddyfile"), "utf8");
    expect(caddy).not.toContain("{query.XTransformPort}");
    // Each allowlisted port has its own matcher + FIXED upstream.
    for (const port of ["3000", "3003", "4100"]) {
      expect(caddy, `matcher for XTransformPort=${port}`).toContain(`@pivot_${port} query XTransformPort=${port}`);
      expect(caddy, `fixed upstream localhost:${port}`).toContain(`reverse_proxy localhost:${port}`);
    }
    // Anything else is refused — and the refusal is a handle (no fall-through).
    expect(caddy).toContain("@pivot_any query XTransformPort=*");
    expect(caddy).toMatch(/handle @pivot_any \{[\s\S]*?respond "Forbidden" 403/);
    // The set is documented at the pivot site (comment names all three).
    expect(caddy).toMatch(/3000 — Next\.js app[\s\S]*?3003 — live-service[\s\S]*?4100 — backend-go/);
  });
});
