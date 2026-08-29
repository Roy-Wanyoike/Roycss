# Mini Services

RoyCSS is a Next.js application. Optional mini-services (running on their own
ports) can be added here for features that don't fit the main request/response
cycle — for example a websocket-based real-time effect playground, or a
long-running background job.

## Conventions

Each mini-service:

1. Is a new and independent bun project with its own `package.json`.
2. Has `index.ts` (or `index.js`) as the entry file.
3. Defines a specific port (NOT the `PORT` env var).
4. Is started with `bun run dev` in the background.
5. Supports auto-restart on file change (prefer `bun --hot`).

## Communication

The main Next.js app talks to mini-services via the built-in gateway (Caddy).
Frontend requests use **relative paths** only, with `XTransformPort` in the
query string:

```ts
// Frontend (browser)
fetch('/api/some-endpoint?XTransformPort=3030')
```

```ts
// Websocket (browser)
import { io } from 'socket.io-client'
io('/?XTransformPort=3030')
```

Never write `http://localhost:3030` in the frontend — the gateway handles
routing.

## Reference

See `examples/websocket/` for a complete websocket demo (frontend + server)
that follows these conventions.
