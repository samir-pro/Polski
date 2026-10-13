/* ============================================================================
 * Service worker — makes the app work offline.
 *
 * Strategy: stale-while-revalidate. Pages load instantly from the cache and
 * the cache refreshes in the background, so a new deployment shows up on the
 * next visit. Bump VERSION when the list of files changes.
 * ========================================================================== */

const VERSION = "popolsku-v2";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon.svg",
  "css/styles.css",
  "js/content.js",
  "js/guide.js",
  "js/grammar.js",
  "js/audio.js",
  "js/sounds.js",
  "js/storage.js",
  "js/exercises.js",
  "js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
