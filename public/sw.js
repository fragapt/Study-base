/* Base de Estudo — service worker: offline shell + web push. */
const CACHE = "estudo-shell-v2";
// Only the offline fallback is precached. We intentionally do NOT cache "/",
// because it is an auth-gated, redirecting route — caching it caused stale /
// broken shells and interfered with the login round-trip.
const SHELL = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

// Paths the service worker must never intercept: auth (OAuth callback + login),
// API routes, and the SW itself. These must always hit the network so redirects
// and Set-Cookie work and the login flow is never served a cached page.
function isBypassed(url) {
  return (
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/api") ||
    url.pathname === "/login" ||
    url.pathname === "/sw.js"
  );
}

// Network-first for page navigations, falling back to the offline page ONLY
// when the network actually fails. Auth/API/cross-origin requests are passed
// straight through to the browser (no respondWith).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.mode !== "navigate") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin || isBypassed(url)) return;

  event.respondWith(
    // For a navigation request the response may be a redirect (e.g. / -> /login
    // when signed out); returning it lets the browser follow it normally. We
    // only serve the offline page when the network genuinely fails.
    fetch(req).catch(async () => {
      const offline = await caches.match("/offline");
      return offline || Response.error();
    }),
  );
});

// ── Web push ──────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Base de Estudo", body: event.data && event.data.text() };
  }
  const title = payload.title || "Base de Estudo";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: { url: payload.url || "/exames" },
    tag: payload.tag,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
