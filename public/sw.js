/* Harry The Blaze service worker.
 *
 * Deliberately small. It makes the site installable and shows a friendly page when the
 * phone is offline. It does NOT cache pages or API calls: the app always loads fresh from
 * the network, so a deploy is live immediately and payments/login are never served stale.
 * It never touches requests to other origins (Clerk, Supabase, Razorpay, fonts, analytics).
 */
const VERSION = "v1";
const SHELL_CACHE = `hb-shell-${VERSION}`;
const ASSET_CACHE = `hb-assets-${VERSION}`;
const SHELL = ["/offline.html", "/favicon.svg", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL_CACHE, ASSET_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // third parties: leave alone
  if (url.pathname.startsWith("/api/")) return;                // our own API routes: leave alone

  // Page loads: network first; only if the network is down, show the offline page.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Build output is content-hashed (/assets/index-abc123.js), so caching it forever is safe.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
  }
});
