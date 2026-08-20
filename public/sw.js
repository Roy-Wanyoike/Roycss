// RoyCSS Service Worker v2.1.0
// Network-first for HTML + /api/*, stale-while-revalidate for static assets,
// app shell pre-cache, SKIP_WAITING message listener.
// Repo: https://github.com/Roy-Wanyoike/roycss

const VERSION = "v2.1.0";
const CACHE_PREFIX = "roycss-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${VERSION}`;

// App shell — pre-cached on install for instant offline landing.
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/apple-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.all(
          APP_SHELL.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => {
              /* best-effort — ignore individual failures */
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                !k.startsWith(CACHE_PREFIX) ||
                (k !== SHELL_CACHE && k !== RUNTIME_CACHE),
            )
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Skip cross-origin (unpkg, fonts, CDN, analytics)
  if (url.origin !== self.location.origin) return;
  // Skip chrome-extension and blob URLs
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Network-first: navigations (HTML) and API endpoints
  const isNavigation = request.mode === "navigate";
  const isApi = url.pathname.startsWith("/api/");
  if (isNavigation || isApi) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stale-while-revalidate: static assets (CSS, JS, images, fonts)
  event.respondWith(staleWhileRevalidate(event, request));
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (_err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Fallback to app shell for navigations
    if (request.mode === "navigate") {
      const shell = await caches.match("/");
      if (shell) return shell;
    }
    return new Response("Offline and no cache available", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok && fresh.type === "basic") {
        cache.put(request, fresh.clone());
      }
      return fresh;
    })
    .catch(() => null);

  if (cached) {
    // Kick off revalidation in background, return stale immediately
    event.waitUntil(networkPromise);
    return cached;
  }
  const fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response("Offline and no cache available", {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain" },
  });
}
