// RoyCSS Service Worker v2.1.0
// ──────────────────────────────────────────────────────────────────────
// Strategy:
//   - HTML navigations: network-first (always fresh content + offline fallback)
//   - Static JS/CSS chunks: stale-while-revalidate (instant from cache + bg update)
//   - Static images/fonts/manifest: cache-first (immutable)
//   - API routes (GET): network-first (always fresh data + offline fallback)
//   - Everything else: passthrough to network
//
// Excludes:
//   - Cross-origin requests (CDN, fonts, images)
//   - Non-GET requests
//   - chrome-extension URLs
//   - Vercel/Next.js HMR + dev-only routes
//
// Lifecycle:
//   - install: pre-cache the shell (HTML, manifest, icons)
//   - activate: delete old caches, claim all clients
//   - message: skipWaiting on update

const CACHE_VERSION = "roycss-v2.1.0";
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_RUNTIME = `${CACHE_VERSION}-runtime`;
const CACHE_HTML = `${CACHE_VERSION}-html`;

// App shell — the minimal set of assets to make the offline experience work.
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/og.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_STATIC);
      // Use addAll with fall-back — if any single asset fails, we still want
      // the SW to install so the runtime fetch handler can warm the cache.
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET; ignore all other methods (POST/PUT/etc.)
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin (CDN, fonts.googleapis, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith("http")) return;

  // Skip Next.js dev/HMR endpoints
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // Skip /api/* — handled by network-first (see below)
  const isApi = url.pathname.startsWith("/api/");
  const isHtml =
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:css|js|woff2?|ttf|png|jpe?g|gif|svg|webp|avif|ico|wasm)$/.test(
      url.pathname
    );

  // ── 1. HTML navigations: network-first ────────────────────────────
  if (isHtml) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          // Cache a copy for offline use
          const cache = await caches.open(CACHE_HTML);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (err) {
          // Offline — try cache, fall back to root
          const cached = await caches.match(request);
          if (cached) return cached;
          const root = await caches.match("/");
          if (root) return root;
          throw err;
        }
      })()
    );
    return;
  }

  // ── 2. Static assets: stale-while-revalidate ──────────────────────
  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_STATIC);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === "basic") {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        // Return cached immediately if available; otherwise wait for network
        return cached || network;
      })()
    );
    return;
  }

  // ── 3. API routes (GET): network-first with short-circuit fallback ──
  if (isApi) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          // Only cache successful, non-error responses
          if (fresh.ok) {
            const cache = await caches.open(CACHE_RUNTIME);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch (err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  // ── 4. Everything else: passthrough to network ────────────────────
  // (no caching — let the browser handle it)
});
