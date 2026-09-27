// Offline support. The plan (data.json) is network-first so updates show as soon as
// you're online; everything else is served from cache and refreshed in the background.
const CACHE = "odyssey-v5";
const SHELL = [
  "./", "index.html", "styles.css", "app.js", "data.json", "manifest.webmanifest",
  "fonts/newsreader-latin.woff2", "fonts/newsreader-latin-italic.woff2", "icons/icon.svg", "icons/apple-touch-icon.png",
  "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function withTimeout(p, ms){
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

async function networkFirst(req){
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(req, {cache: "no-cache"}), 3000);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, {ignoreSearch: true})) || Response.error();
  }
}

async function staleWhileRevalidate(req, event){
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req, {ignoreSearch: true});
  const fresh = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
  if (cached){ event.waitUntil(fresh.catch(() => {})); return cached; }
  return fresh.catch(async () => (await cache.match("index.html")) || Response.error());
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith("/data.json")) e.respondWith(networkFirst(req));
  else if (req.mode === "navigate") e.respondWith(staleWhileRevalidate(new Request(new URL("./", self.registration.scope)), e));
  else e.respondWith(staleWhileRevalidate(req, e));
});
