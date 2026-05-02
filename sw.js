const CACHE_NAME = "maestro-lite-v1";

// file inti (jangan berat-berat)
const CORE = [
  "./",
  "./index.html",
  "./manifest.json"
];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE))
  );
});

// ACTIVATE (hapus cache lama)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// FETCH STRATEGY (ini “shopee lite logic”)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1. halaman → network first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 2. gambar → cache first (biar ngebut)
  if (req.destination === "image") {
    event.respondWith(
      caches.match(req).then((cached) => {
        return cached || fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        });
      })
    );
    return;
  }

  // 3. lainnya → cache fallback
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});